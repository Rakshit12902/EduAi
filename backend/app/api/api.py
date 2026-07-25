from fastapi import APIRouter
from app.api.endpoints import chats, documents, messages, settings

api_router = APIRouter()
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(messages.router, prefix="/chats/{chat_id}/messages", tags=["messages"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
