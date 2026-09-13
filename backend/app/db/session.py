from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

parsed_url = make_url(settings.DATABASE_URL)
if parsed_url.drivername in ("postgresql", "postgres"):
    parsed_url = parsed_url.set(drivername="postgresql+asyncpg")

connect_args = {}
if "asyncpg" in parsed_url.drivername:
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(parsed_url, pool_pre_ping=True, connect_args=connect_args)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

