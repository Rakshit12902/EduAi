from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings
from contextlib import asynccontextmanager
from app.core.qdrant import init_qdrant

from app.core.rag import init_models
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_qdrant()
    # Run CPU intensive model loading in executor to not block async loop
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, init_models)
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RAG-Based AI Teaching Assistant Backend",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to the EduAI Backend API. Visit /docs for the interactive documentation."}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "EduAI backend is running"}
