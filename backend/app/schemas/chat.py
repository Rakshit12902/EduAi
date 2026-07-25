from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

class ChatBase(BaseModel):
    title: str
    description: Optional[str] = None

class ChatCreate(ChatBase):
    pass

class ChatUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None

class ChatResponse(ChatBase):
    id: uuid.UUID
    user_id: uuid.UUID
    summary: Optional[str] = None
    is_archived: bool
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
