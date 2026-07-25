import logging
import asyncio
from typing import List, Dict, Any, Optional
from uuid import UUID
from sentence_transformers import SentenceTransformer, CrossEncoder
from qdrant_client.models import Filter, FieldCondition, MatchValue
from groq import AsyncGroq
from app.core.config import settings
from app.core.qdrant import qdrant_client, COLLECTION_NAME

logger = logging.getLogger(__name__)

# Global model instances
embedding_model: Optional[SentenceTransformer] = None
reranker_model: Optional[CrossEncoder] = None

groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

def init_models():
    """Load AI models synchronously (called during startup)."""
    global embedding_model, reranker_model
    logger.info("Loading Embedding Model...")
    embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
    logger.info("Loading Reranker Model...")
    reranker_model = CrossEncoder("BAAI/bge-reranker-base")
    logger.info("Models loaded successfully.")

async def embed_query(query: str) -> List[float]:
    """Embed the user's query."""
    if embedding_model is None:
        raise RuntimeError("Embedding model not initialized.")
    # BAAI/bge requires this prefix for queries
    prefixed_query = f"Represent this sentence for searching relevant passages: {query}"
    # SentenceTransformer is synchronous, run in executor
    loop = asyncio.get_event_loop()
    embedding = await loop.run_in_executor(None, embedding_model.encode, prefixed_query)
    return embedding.tolist()

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
                            points.append(fp)
                            existing_ids.add(fp.id)
        except Exception as e:
            logger.error(f"Error in filename-aware retrieval: {e}")

    return points

async def rerank_chunks(query: str, chunks: List[Any], top_n: int = 5) -> List[Any]:
    """Rerank retrieved chunks using CrossEncoder and sigmoid probability normalization."""
    if not chunks:
        return []
    if reranker_model is None:
        raise RuntimeError("Reranker model not initialized.")
        
    import math
    pairs = [[query, point.payload.get("text") or point.payload.get("chunk_text", "")] for point in chunks]
    
    loop = asyncio.get_event_loop()
    raw_scores = await loop.run_in_executor(None, reranker_model.predict, pairs)
    
    # Convert raw logits to sigmoid probability (0.0 to 1.0) and assign to chunk points
    for point, score in zip(chunks, raw_scores):
        prob = 1.0 / (1.0 + math.exp(-float(score)))
        point.score = prob

    # Sort by probability score descending
    chunks.sort(key=lambda x: x.score, reverse=True)
    
    # Require minimum 60% (0.60) relevance match score (Unrelated questions score ~50.0% or lower)
    MIN_RELEVANCE_PROB = 0.60
    
    filtered_chunks = [p for p in chunks if p.score >= MIN_RELEVANCE_PROB]
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
