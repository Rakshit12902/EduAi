import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

def upload_file_to_s3(file_obj, user_id: str, chat_id: str, document_id: str, filename: str) -> str:
    """
    Uploads a file object to S3. 
    Returns the object key (path) in S3.
    """
    s3_key = f"{user_id}/{chat_id}/{document_id}/{filename}"
    try:
        s3_client.upload_fileobj(
            file_obj,
            settings.AWS_BUCKET_NAME,
            s3_key
        )
        return s3_key
    except ClientError as e:
        logger.error(f"Failed to upload to S3: {e}")
        raise e

def get_presigned_url(s3_key: str, expiration=3600) -> str:
    """
    Generate a presigned URL to share an S3 object
    """
    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': settings.AWS_BUCKET_NAME,
                                                            'Key': s3_key},
                                                    ExpiresIn=expiration)
    except ClientError as e:
        logger.error(e)
        return None
    return response

def download_file_from_s3(s3_key: str, local_path: str):
    """
    Downloads a file from S3 to local disk (used by Celery worker).
    """
    try:
        s3_client.download_file(settings.AWS_BUCKET_NAME, s3_key, local_path)
    except ClientError as e:
        logger.error(f"Failed to download from S3: {e}")
        raise e

def delete_s3_prefix(prefix: str):
    """
    Deletes all objects under a specific prefix (e.g. when deleting a chat or document)
    """
    try:
        # First, list all objects under the prefix
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=settings.AWS_BUCKET_NAME, Prefix=prefix)
        
        objects_to_delete = []
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    objects_to_delete.append({'Key': obj['Key']})
        
        if objects_to_delete:
            s3_client.delete_objects(
                Bucket=settings.AWS_BUCKET_NAME,
                Delete={'Objects': objects_to_delete}
            )
    except ClientError as e:
        logger.error(f"Failed to delete prefix from S3: {e}")
        raise e
