import os
import tempfile
import asyncio
import uuid
import logging
from app.core.config import settings
from app.core.aws import download_file_from_s3
from app.core.qdrant import qdrant_client, COLLECTION_NAME
from app.services.document_parser import extract_text_from_pdf, extract_text_from_txt, extract_text_from_image, chunk_text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.document import Document, ProcessingJob, DocumentChunk
from app.models.enums import DocumentStatus, JobStatus
from qdrant_client.http.models import PointStruct

logger = logging.getLogger(__name__)

async def get_gemini_embeddings_batch_async(texts: list[str]) -> list[list[float]]:
    """Helper to get batch embeddings via Google API without blocking the event loop"""
    if not settings.GEMINI_API_KEY:
        return [[0.0] * 3072 for _ in texts]
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.embed_content(
            model='gemini-embedding-001',
            contents=texts,
        )
    )
    return [e.values for e in response.embeddings]

async def update_job_status(db: AsyncSession, job_id, status: JobStatus, progress: int, step: str, error: str = None):
    result = await db.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
    job = result.scalars().first()
    if job:
        job.status = status
        job.progress = progress
        job.current_step = step
        if error:
            job.error_message = error
        await db.commit()

async def process_document_async(document_id: str):
    """
    Fully asynchronous document processing pipeline.
    Runs inside a FastAPI BackgroundTask without blocking the main event loop.
    """
    logger.info(f"Starting async document processing for doc: {document_id}")
    
    async with AsyncSessionLocal() as db:
        try:
            # Fetch document and job
            doc_uuid = uuid.UUID(document_id)
            doc_result = await db.execute(select(Document).where(Document.id == doc_uuid))
            doc = doc_result.scalars().first()
            
            job_result = await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == doc_uuid))
            job = job_result.scalars().first()
            
            if not doc or not job:
                logger.error("Document or Job not found")
                return {"error": "Not found"}

            await update_job_status(db, job.id, JobStatus.RUNNING, 10, "Downloading from storage")
            doc.status = DocumentStatus.PROCESSING
            await db.commit()
            
            # 1. Download file (running synchronous boto3 in executor)
            loop = asyncio.get_event_loop()
            with tempfile.TemporaryDirectory() as tmpdirname:
                local_path = os.path.join(tmpdirname, doc.filename)
                
                await loop.run_in_executor(None, download_file_from_s3, doc.storage_path, local_path)
                
                await update_job_status(db, job.id, JobStatus.RUNNING, 30, "Extracting text")
                
                # 2. Extract Text (running CPU bound extraction in executor)
                ext = doc.filename.split('.')[-1].lower()
                if ext == 'pdf':
                    text = await loop.run_in_executor(None, extract_text_from_pdf, local_path)
                elif ext in ['txt', 'md']:
                    text = await loop.run_in_executor(None, extract_text_from_txt, local_path)
                elif ext in ['png', 'jpg', 'jpeg', 'webp']:
                    text = await loop.run_in_executor(None, extract_text_from_image, local_path)
                else:
                    raise ValueError(f"Unsupported file extension: {ext}")
                    
                await update_job_status(db, job.id, JobStatus.RUNNING, 60, "Chunking text")
                
                # 3. Chunk Text
                chunks = await loop.run_in_executor(None, chunk_text, text)
                doc.total_chunks = len(chunks)
                await db.commit()
                
                if not chunks:
                    raise ValueError("No text could be extracted from document")

                await update_job_status(db, job.id, JobStatus.RUNNING, 80, "Generating embeddings")
                
                # 4. Generate Embeddings & Qdrant points in batches of 50
                points = []
                db_chunks = []
                
                batch_size = 50
                for batch_start in range(0, len(chunks), batch_size):
                    batch_chunks = chunks[batch_start:batch_start+batch_size]
                    await asyncio.sleep(0) # yield control
                    
                    batch_embs = await get_gemini_embeddings_batch_async(batch_chunks)
                    
                    for i, (chunk_text_data, emb) in enumerate(zip(batch_chunks, batch_embs)):
                        global_i = batch_start + i
                        chunk_uuid = uuid.uuid4()
                        chunk_id = str(chunk_uuid)
                        
                        payload = {
                            "chunk_id": chunk_id,
                            "user_id": str(doc.user_id),
                            "chat_id": str(doc.chat_id),
                            "document_id": str(doc.id),
                            "filename": doc.filename,
                            "chunk_index": global_i,
                            "chunk_text": chunk_text_data,
                            "text": chunk_text_data,
                        }
                        
                        points.append(PointStruct(id=chunk_id, vector=list(emb), payload=payload))
                        
                        db_chunks.append(DocumentChunk(
                            id=chunk_uuid,
                            document_id=doc.id,
                            chat_id=doc.chat_id,
                            user_id=doc.user_id,
                            chunk_index=global_i,
                            text=chunk_text_data,
                            char_count=len(chunk_text_data),
                            qdrant_point_id=chunk_id
                        ))
                
                await update_job_status(db, job.id, JobStatus.RUNNING, 90, "Uploading to Vector DB")
                
                # Save to Qdrant (using async client)
                await qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
                
                # Save to PostgreSQL
                db.add_all(db_chunks)
                doc.status = DocumentStatus.READY
                await update_job_status(db, job.id, JobStatus.COMPLETED, 100, "Processing complete")
                await db.commit()
                
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to process document {document_id}: {e}")
            
            doc_uuid = uuid.UUID(document_id)
            doc_result = await db.execute(select(Document).where(Document.id == doc_uuid))
            doc = doc_result.scalars().first()
            if doc:
                doc.status = DocumentStatus.FAILED
                doc.error_message = str(e)
                db.add(doc)
                
            job_result = await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == doc_uuid))
            job = job_result.scalars().first()
            if job:
                job.status = JobStatus.FAILED
                job.current_step = "Failed"
                job.error_message = str(e)
                db.add(job)
                
            await db.commit()
            
        return {"document_id": document_id, "status": "completed"}
