from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import get_db, get_current_user
from app.models.chat import Chat
from app.models.document import Document, ProcessingJob
from app.models.enums import DocumentStatus, JobStatus
from app.core.aws import upload_file_to_s3
from app.worker import process_document_task
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_MIME_TYPES = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp"
]

@router.post("/chats/{chat_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(
    chat_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id
    
    # 1. Validate chat ownership
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id))
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or access denied")
        
    # 2. Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file format")
        
    # 3. Validate file size (by reading content into memory, or checking headers if possible, but reading is safer for accurate size)
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_MB}MB")
        
    # Reset file pointer after reading
    await file.seek(0)
    
    # 4. Generate Document ID and Upload to S3
    document_id = str(uuid.uuid4())
    try:
        s3_path = upload_file_to_s3(file.file, user_id, chat_id, document_id, file.filename)
    except Exception as e:
        logger.error(f"S3 Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")
        
    # 5. Insert Document into Database
    new_document = Document(
        id=document_id,
        chat_id=chat_id,
        user_id=user_id,
        filename=file.filename,
        original_filename=file.filename,
        file_type=file.filename.split('.')[-1] if '.' in file.filename else "unknown",
        mime_type=file.content_type,
        file_size=file_size,
        storage_path=s3_path,
        status=DocumentStatus.UPLOADING
    )
    db.add(new_document)
    await db.commit()
    
    # 6. Insert ProcessingJob
    new_job = ProcessingJob(
        document_id=document_id,
        status=JobStatus.QUEUED,
        progress=0
    )
    db.add(new_job)
    await db.commit()
    
    # 7. Dispatch Celery Task
    task = process_document_task.delay(document_id)
    
    # Update job with celery task id
    new_job.celery_task_id = task.id
    await db.commit()
    
    return {
        "document_id": document_id,
        "filename": file.filename,
        "status": "QUEUED",
        "job_id": new_job.id
    }

@router.get("/documents/{document_id}/status")
async def get_document_status(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id
    
    # Check ownership via join
    result = await db.execute(
        select(ProcessingJob)
        .join(Document)
        .where(Document.id == document_id, Document.user_id == user_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
        
    return {
        "document_id": document_id,
        "status": job.status.value,
        "progress": job.progress,
        "current_step": job.current_step,
        "error": job.error_message
    }
