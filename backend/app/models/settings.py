import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Numeric, Enum, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
from app.models.enums import AppTheme, AppLanguage

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, unique=True)
    theme = Column(Enum(AppTheme), nullable=False, default=AppTheme.system)
    language = Column(Enum(AppLanguage), nullable=False, default=AppLanguage.en)
    llm_model = Column(String(255), nullable=False, default="llama-3.1-70b-versatile")
    embedding_model = Column(String(255), nullable=False, default="BAAI/bge-small-en-v1.5")
    temperature = Column(Numeric(3, 2), nullable=False, default=0.20)
    max_tokens = Column(Integer, nullable=False, default=1024)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("UserProfile", back_populates="settings")


class UserApiKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(100), nullable=False)
    encrypted_key = Column(Text, nullable=False)
    key_hint = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("UserProfile") # one-way relationship

    __table_args__ = (
        UniqueConstraint('user_id', 'provider', name='uix_user_provider'),
    )
