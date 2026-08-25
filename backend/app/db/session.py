import urllib.parse
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("postgresql://") or db_url.startswith("postgresql+asyncpg://"):
    connect_args["statement_cache_size"] = 0
    if db_url.startswith("postgresql://"):
        parts = db_url.split("@")
        if len(parts) == 2:
            auth_part, host_part = parts
            auth_split = auth_part.split("://")[1].split(":")
            if len(auth_split) == 2:
                user, password = auth_split
                encoded_password = urllib.parse.quote_plus(password)
                db_url = f"postgresql+asyncpg://{user}:{encoded_password}@{host_part}"
            else:
                db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        else:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
