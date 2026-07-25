import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduAI Assistant API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str # Service role key
    SUPABASE_JWT_SECRET: str
    
    # LLM APIs
    GROQ_API_KEY: str
    GEMINI_API_KEY: str = ""
    
    # Redis
    REDIS_URL: str
    
    # Qdrant
    QDRANT_URL: str
    QDRANT_API_KEY: str

    # AWS S3
    AWS_BUCKET_NAME: str
    AWS_REGION: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
