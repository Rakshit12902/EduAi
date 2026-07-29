from qdrant_client import AsyncQdrantClient
from qdrant_client.http.models import Distance, VectorParams, PayloadSchemaType
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Async Qdrant Client
qdrant_client = AsyncQdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
)

COLLECTION_NAME = "teaching_assistant"

async def init_qdrant():
    """
    Ensure the Qdrant collection exists and payload indices are created.
    Called during application startup.
    """
    try:
        exists = await qdrant_client.collection_exists(COLLECTION_NAME)
        if not exists:
            logger.info(f"Creating Qdrant collection: {COLLECTION_NAME}")
            await qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=3072, distance=Distance.COSINE),
            )
            
            # Create payload indices for fast filtering as specified in FRD
            await qdrant_client.create_payload_index(COLLECTION_NAME, "user_id", PayloadSchemaType.KEYWORD)
            await qdrant_client.create_payload_index(COLLECTION_NAME, "chat_id", PayloadSchemaType.KEYWORD)
            await qdrant_client.create_payload_index(COLLECTION_NAME, "document_id", PayloadSchemaType.KEYWORD)
            
            logger.info("Successfully created Qdrant collection and indices.")
        else:
            logger.info(f"Qdrant collection '{COLLECTION_NAME}' already exists.")
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant: {e}")
        # Not raising here so the app can still start without Qdrant if needed, but logging it
