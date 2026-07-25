from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import AppTheme, AppLanguage

class UserSettingsResponse(BaseModel):
    id: UUID
    user_id: UUID
    theme: AppTheme
    language: AppLanguage
    llm_model: str
    embedding_model: str
    temperature: float
    max_tokens: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    theme: Optional[AppTheme] = None
    language: Optional[AppLanguage] = None
    llm_model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=128, le=4096)
