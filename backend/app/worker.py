import os
import tempfile
from celery import Celery
from app.core.config import settings
from app.core.aws import download_file_from_s3
from app.core.qdrant import qdrant_client, COLLECTION_NAME
from app.services.document_parser import extract_text_from_pdf, extract_text_from_txt, extract_text_from_image, chunk_text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import engine
from app.models.document import Document, ProcessingJob, DocumentChunk
from app.models.enums import DocumentStatus, JobStatus
from qdrant_client.http.models import PointStruct
from sentence_transformers import SentenceTransformer
import asyncio
import uuid
import logging

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Configuration for Celery
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True
)

# Load Embedding Model
embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")

# Synchronous DB session maker since Celery tasks are mostly sync
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# We need a sync engine for the celery worker since it's running synchronously
sync_db_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
sync_engine = create_engine(sync_db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

def update_job_status(db, job_id, status: JobStatus, progress: int, step: str, error: str = None):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if job:
        job.status = status
        job.progress = progress
        job.current_step = step
        if error:
            job.error_message = error
        db.commit()

@celery_app.task(
    bind=True,
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True
)
def process_document_task(self, document_id: str):
    logger.info(f"Starting document processing for doc: {document_id}")
    
    db = SessionLocal()
    try:
        # Fetch document and job
        doc = db.query(Document).filter(Document.id == document_id).first()
        job = db.query(ProcessingJob).filter(ProcessingJob.document_id == document_id).first()
        
        if not doc or not job:
            logger.error("Document or Job not found")
            return {"error": "Not found"}

        update_job_status(db, job.id, JobStatus.RUNNING, 10, "Downloading from storage")
        doc.status = DocumentStatus.PROCESSING
        db.commit()
        
        # 1. Download file
        with tempfile.TemporaryDirectory() as tmpdirname:
            local_path = os.path.join(tmpdirname, doc.filename)
            download_file_from_s3(doc.storage_path, local_path)
            
            update_job_status(db, job.id, JobStatus.RUNNING, 30, "Extracting text")
            
            # 2. Extract Text
            ext = doc.filename.split('.')[-1].lower()
            if ext == 'pdf':
                text = extract_text_from_pdf(local_path)
            elif ext in ['txt', 'md']:
                text = extract_text_from_txt(local_path)
            elif ext in ['png', 'jpg', 'jpeg', 'webp']:
                text = extract_text_from_image(local_path)
            else:
                raise ValueError(f"Unsupported file extension: {ext}")
                
            update_job_status(db, job.id, JobStatus.RUNNING, 60, "Chunking text")
            
            # 3. Chunk Text
            chunks = chunk_text(text)
            doc.total_chunks = len(chunks)
            db.commit()
            
            if not chunks:
                raise ValueError("No text could be extracted from document")

            update_job_status(db, job.id, JobStatus.RUNNING, 80, "Generating embeddings")
            
            # 4. Generate Embeddings & Qdrant points
            embeddings = embedder.encode(chunks, normalize_embeddings=True)
            
            points = []
            db_chunks = []
            
            for i, (chunk_text_data, emb) in enumerate(zip(chunks, embeddings)):
                chunk_id = str(uuid.uuid4())
                
                # Metadata payload for Qdrant
                payload = {
                    "chunk_id": chunk_id,
                    "user_id": str(doc.user_id),
                    "chat_id": str(doc.chat_id),
                    "document_id": str(doc.id),
                    "filename": doc.filename,
                    "chunk_index": i,
                    "chunk_text": chunk_text_data,
                    "text": chunk_text_data,
                }
                
                points.append(
                    PointStruct(id=chunk_id, vector=emb.tolist(), payload=payload)
                )
                
                db_chunks.append(DocumentChunk(
                    id=chunk_id,
                    document_id=doc.id,
                    chat_id=doc.chat_id,
                    user_id=doc.user_id,
                    chunk_index=i,
                    text=chunk_text_data,
                    char_count=len(chunk_text_data),
                    qdrant_point_id=chunk_id
                ))
            
            update_job_status(db, job.id, JobStatus.RUNNING, 90, "Uploading to Vector DB")
            
            # Save to Qdrant (using asyncio to run the async client method synchronously)
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
            loop.run_until_complete(
                qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
            )
            
            # Save to PostgreSQL
            db.bulk_save_objects(db_chunks)
            doc.status = DocumentStatus.READY
            update_job_status(db, job.id, JobStatus.COMPLETED, 100, "Processing complete")
            db.commit()
            
    except Exception as e:
        logger.error(f"Failed to process document {document_id}: {e}")
        doc = db.query(Document).filter(Document.id == document_id).first()
        job = db.query(ProcessingJob).filter(ProcessingJob.document_id == document_id).first()
        if doc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)
        if job:
            update_job_status(db, job.id, JobStatus.FAILED, job.progress, "Failed", str(e))
        db.commit()
        raise e
    finally:
        db.close()
        
    return {"document_id": document_id, "status": "completed"}
