import logging
import asyncio
from typing import List, Dict, Any, Optional
from qdrant_client.models import Filter, FieldCondition, MatchValue
from groq import AsyncGroq
from app.core.config import settings
from app.core.qdrant import qdrant_client, COLLECTION_NAME

logger = logging.getLogger(__name__)

groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

def init_models():
    """No local models needed anymore! We use Google API for embeddings to save RAM."""
    logger.info("Using lightweight external APIs for embeddings. Local PyTorch models skipped.")

async def embed_query(query: str) -> List[float]:
    """Embed the user's query using Google's text-embedding-004 API."""
    if not settings.GEMINI_API_KEY:
        logger.warning("No GEMINI_API_KEY provided. Returning zero-vector fallback for RAG.")
        return [0.0] * 384 # Fallback dimension length
        
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # Run synchronous network call in threadpool
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None, 
        lambda: client.models.embed_content(
            model='gemini-embedding-001',
            contents=query,
        )
    )
    return response.embeddings[0].values

async def retrieve_chunks(user_id: str, chat_id: str, query_vector: List[float], query: str = "", top_k: int = 20) -> List[Any]:
    """Retrieve top chunks from Qdrant strictly filtered by user_id and chat_id."""
    points = await qdrant_client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=top_k,
        query_filter=Filter(
            must=[
                FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                FieldCondition(key="chat_id", match=MatchValue(value=chat_id)),
            ]
        ),
        with_payload=True
    )
    
    # If the user query specifically mentions an uploaded filename, include its chunks explicitly
    if query:
        try:
            scroll_res = await qdrant_client.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                        FieldCondition(key="chat_id", match=MatchValue(value=chat_id))
                    ]
                ),
                limit=100,
                with_payload=True
            )
            
            user_filenames = set(p.payload.get("filename") for p in scroll_res[0] if p.payload.get("filename"))
            mentioned_files = [fn for fn in user_filenames if fn.lower() in query.lower()]
            
            if mentioned_files:
                existing_ids = set(p.id for p in points)
                for fn in mentioned_files:
                    file_points = await qdrant_client.scroll(
                        collection_name=COLLECTION_NAME,
                        scroll_filter=Filter(
                            must=[
                                FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                                FieldCondition(key="chat_id", match=MatchValue(value=chat_id)),
                                FieldCondition(key="filename", match=MatchValue(value=fn))
                            ]
                        ),
                        limit=20,
                        with_payload=True
                    )
                    for fp in file_points[0]:
                        if fp.id not in existing_ids:
                            # explicitly set score so it doesn't get filtered out by 0.15 threshold
                            fp.score = 1.0
                            points.append(fp)
                            existing_ids.add(fp.id)
        except Exception as e:
            logger.error(f"Error in filename-aware retrieval: {e}")

    return points

async def rerank_chunks(query: str, chunks: List[Any], top_n: int = 5) -> List[Any]:
    """Return top chunks. Local PyTorch reranking is disabled to stay under 512MB RAM."""
    if not chunks:
        return []
        
    # We sort by the Qdrant retrieval score since we aren't using a heavy local reranker
    chunks.sort(key=lambda x: getattr(x, 'score', 0.0), reverse=True)
    
    # Require minimum 0.15 relevance match score for Gemini embeddings
    MIN_RELEVANCE_PROB = 0.15
    
    filtered_chunks = [p for p in chunks if getattr(p, 'score', 0.0) >= MIN_RELEVANCE_PROB]
    return filtered_chunks[:top_n]

LANG_MAP = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "es": "Spanish (Español)",
    "fr": "French (Français)",
    "de": "German (Deutsch)",
    "zh": "Chinese (中文)",
    "ar": "Arabic (العربية)",
    "pt": "Portuguese (Português)"
}

def build_prompt(query: str, context_chunks: List[Any], history: List[Dict[str, str]], language: str = "en") -> List[Dict[str, str]]:
    """Build the prompt for the Groq LLM with application language instruction."""
    
    if language and language.lower() not in ["en", "english"]:
        target_lang = LANG_MAP.get(language.lower(), language)
        lang_instruction = (
            f"CRITICAL LANGUAGE INSTRUCTION: You MUST write your entire response strictly in {target_lang}, "
            f"regardless of the language used in previous conversation history. "
            f"All text, headings, bullet points, and explanations MUST be written in {target_lang}.\n\n"
        )
    else:
        lang_instruction = (
            "CRITICAL LANGUAGE INSTRUCTION: You MUST write your response in English (or match the language of the user's latest query), "
            "regardless of the language used in previous conversation history.\n\n"
        )
    
    system_prompt = (
        f"{lang_instruction}"
        "You are a helpful teaching assistant. Answer questions based on the provided document context. "
        "The user has uploaded documents and their extracted text is provided in the CONTEXT section below. "
        "If the user asks you to read, summarize, or analyze a file, they are referring to the CONTEXT. "
        "Do NOT say you cannot read files. Instead, use the CONTEXT to fulfill their request. "
        "If the answer is in the context, cite the source using the filename and page number. "
        "If the answer is not available in the context, answer directly from your general knowledge. "
        "Do not hallucinate facts."
    )
    
    context_text = "CONTEXT:\n"
    if context_chunks:
        for chunk in context_chunks:
            payload = chunk.payload
            filename = payload.get("filename", "Unknown")
            page = payload.get("page_number", "?")
            text = payload.get("text") or payload.get("chunk_text", "")
            context_text += f"[{filename} | Page {page}]\n{text}\n\n"
    else:
        context_text += "No documents provided.\n"
        
    system_prompt += "\n\n" + context_text

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
        
    # Add current query with explicit language constraint tag
    target_lang_str = LANG_MAP.get(language.lower(), "English") if (language and language.lower() not in ["en", "english"]) else "English"
    final_user_query = f"{query}\n\n[System Instruction: Answer strictly in {target_lang_str}. Ignore any previous foreign language in conversation history.]"
    messages.append({"role": "user", "content": final_user_query})
    
    return messages
