from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from app.models.enums import MessageRole, AnswerType

class MessageSourceSchema(BaseModel):
    id: UUID
    message_id: UUID
    document_id: UUID
    page_number: Optional[int] = None
    relevance_score: Optional[float] = None
    excerpt: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class MessageBase(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=32000)

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: UUID
    chat_id: UUID
    answer_type: Optional[AnswerType] = None
    created_at: datetime
    sources: List[MessageSourceSchema] = []
    
    model_config = ConfigDict(from_attributes=True)
