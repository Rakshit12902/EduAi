import json
import asyncio
import re
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.db.session import AsyncSessionLocal
from app.api.deps import get_db, get_current_user
from app.schemas.message import MessageCreate, MessageResponse, MessageSourceSchema
from app.models.chat import Chat
from app.models.message import Message, MessageSource
from app.models.enums import MessageRole, AnswerType
from app.models.user import UserProfile
from app.core.rag import embed_query, retrieve_chunks, rerank_chunks, build_prompt, groq_client
from app.core.config import settings

router = APIRouter()

class ThinkFilter:
    def __init__(self):
        self.in_think = False
        self.buffer = ""
        self.think_start_tag = "<think>"
        self.think_end_tag = "</think>"
    
    def process(self, chunk: str) -> str:
        self.buffer += chunk
        output = ""
        while self.buffer:
            if self.in_think:
                end_idx = self.buffer.find(self.think_end_tag)
                if end_idx != -1:
                    self.in_think = False
                    self.buffer = self.buffer[end_idx + len(self.think_end_tag):]
                else:
                    potential_partial = False
                    for i in range(1, len(self.think_end_tag)):
                        if self.buffer.endswith(self.think_end_tag[:i]):
                            potential_partial = True
                            self.buffer = self.buffer[-i:]
                            break
                    if not potential_partial:
                        self.buffer = ""
                    break
            else:
                start_idx = self.buffer.find(self.think_start_tag)
                if start_idx != -1:
                    output += self.buffer[:start_idx]
                    self.in_think = True
                    self.buffer = self.buffer[start_idx + len(self.think_start_tag):]
                else:
                    potential_partial = False
                    for i in range(1, len(self.think_start_tag)):
                        if self.buffer.endswith(self.think_start_tag[:i]):
                            potential_partial = True
                            output += self.buffer[:-i]
                            self.buffer = self.buffer[-i:]
                            break
                    if not potential_partial:
                        output += self.buffer
                        self.buffer = ""
                    break
        return output

    def flush(self) -> str:
        if self.in_think and self.buffer:
            return "\n\n*[The AI's reasoning process exceeded the token limit and was cut off. Try asking a simpler question.]*"
        return self.buffer

from sqlalchemy.orm import selectinload

@router.get("/", response_model=List[MessageResponse])
@router.get("", include_in_schema=False, response_model=List[MessageResponse])
async def get_messages(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get chat history for a specific chat."""
    # Validate chat ownership
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id))
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Fetch messages
    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .options(
            selectinload(Message.sources).selectinload(MessageSource.document),
            selectinload(Message.feedback)
        )
        .order_by(Message.created_at.asc())
    )
    raw_messages = result.scalars().all()
    # Filter out empty messages (e.g. from aborted or interrupted generation)
    messages = [m for m in raw_messages if m.content and m.content.strip()]
    return messages

async def generate_chat_stream(
    db_session_factory,
    chat_id: str,
    user_id: str,
    query: str,
    history: List[Dict[str, str]]
):
    """Generator for StreamingResponse."""
    
    # 1. Save user message to DB immediately
    async with db_session_factory() as db:
        user_message = Message(
            chat_id=chat_id,
            user_id=user_id,
            role=MessageRole.user,
            content=query
        )
        db.add(user_message)
        await db.commit()

    # 2. RAG Pipeline
    try:
        # Embed query and retrieve multi-document chunks
        try:
            query_vector = await embed_query(query)
            
            # Retrieve chunks across all uploaded documents in this chat
            retrieved_chunks = await retrieve_chunks(
                user_id=str(user_id), 
                chat_id=str(chat_id), 
                query_vector=query_vector, 
                query=query, 
                top_k=30
            )
            
            # Multi-document fair balancing and generous context window (top_n=15)
            top_chunks = await rerank_chunks(query=query, chunks=retrieved_chunks, top_n=15)
        except Exception as rag_err:
            import logging
            logging.getLogger(__name__).warning(f"RAG retrieval warning, falling back to general knowledge: {rag_err}")
            top_chunks = []
        
        # Fetch user settings for model, temperature & language
        user_model = "openai/gpt-oss-120b"
        user_temp = 0.2
        user_lang = "en"
        async with db_session_factory() as db:
            from app.models.settings import UserSettings
            settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
            u_settings = settings_res.scalars().first()
            if u_settings:
                if u_settings.llm_model:
                    user_model = u_settings.llm_model
                if u_settings.temperature is not None:
                    user_temp = float(u_settings.temperature)
                if u_settings.language:
                    user_lang = u_settings.language.value if hasattr(u_settings.language, 'value') else str(u_settings.language)

        # Allowlist of valid Groq model identifiers on this environment
        ALLOWED_GROQ_MODELS = {
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "qwen/qwen3.6-27b",
            "qwen/qwen3.8-27b",
        }
        # Map legacy/UI model names to valid Groq models
        GROQ_MODEL_MAP = {
            # Active native Groq models
            "openai/gpt-oss-120b": "openai/gpt-oss-120b",
            "openai/gpt-oss-20b": "openai/gpt-oss-20b",
            "qwen/qwen3.6-27b": "qwen/qwen3.6-27b",
            "qwen/qwen3.8-27b": "qwen/qwen3.8-27b",
            # Legacy aliases
            "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
            "llama-3.1-8b-instant": "openai/gpt-oss-20b",
            "deepseek-r1-distill-llama-70b": "qwen/qwen3.6-27b",
            "gemma2-9b-it": "openai/gpt-oss-20b",
            "gemma-2-9b-it": "openai/gpt-oss-20b",
        }

        # Check if any retrieved chunks actually match the query with meaningful relevance (>= 0.60)
        # If all chunks are below 0.60, the query is a General Knowledge question (not grounded in documents).
        RELEVANCE_THRESHOLD = 0.60
        has_document_match = any(getattr(c, "score", 0.0) >= RELEVANCE_THRESHOLD for c in top_chunks)
        prompt_chunks = top_chunks if has_document_match else []

        # Build prompt with user language preference
        messages = build_prompt(query=query, context_chunks=prompt_chunks, history=history, language=user_lang)

        # 3. Stream from selected provider (Gemini or Groq)
        if user_model == "gemini-3.6-flash":
            try:
                from google import genai
                gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                gemini_prompt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
                stream = gemini_client.aio.models.generate_content_stream(
                    model='gemini-3.6-flash',
                    contents=gemini_prompt
                )
            except Exception as gemini_err:
                import logging
                logging.getLogger(__name__).warning(f"Gemini API failed ({gemini_err}). Falling back to Groq...")
                stream = await groq_client.chat.completions.create(
                    messages=messages,
                    model="openai/gpt-oss-120b",
                    temperature=user_temp,
                    max_tokens=2048,
                    stream=True
                )
        else:
            resolved_groq_model = GROQ_MODEL_MAP.get(user_model, "openai/gpt-oss-120b")
            if resolved_groq_model not in ALLOWED_GROQ_MODELS:
                resolved_groq_model = "openai/gpt-oss-120b"

            try:
                stream = await groq_client.chat.completions.create(
                    messages=messages,
                    model=resolved_groq_model,
                    temperature=user_temp,
                    max_tokens=2048,
                    stream=True
                )
            except Exception as groq_err:
                import logging
                logging.getLogger(__name__).warning(f"Groq API failed ({groq_err}). Falling back to Gemini Flash...")
                
                if not settings.GEMINI_API_KEY:
                    raise Exception(f"Groq failed ({groq_err}) and no Gemini fallback API key provided.")
                    
                from google import genai
                gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                gemini_prompt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
                stream = gemini_client.aio.models.generate_content_stream(
                    model='gemini-3.6-flash',
                    contents=gemini_prompt
                )

        full_response = ""
        think_filter = ThinkFilter()
        
        # Async generator handles both AsyncGroq and google-genai aio streams
        async for chunk in stream:
            # Handle different chunk object structures
            content = ""
            if hasattr(chunk, 'text'):
                content = chunk.text
            elif hasattr(chunk, 'choices') and chunk.choices and hasattr(chunk.choices[0].delta, 'content'):
                content = chunk.choices[0].delta.content
                
            if content:
                filtered = think_filter.process(content)
                if filtered:
                    full_response += filtered
                    payload = json.dumps({"type": "token", "text": filtered})
                    yield f"data: {payload}\n\n"
                        
        # Flush any remaining text in the buffer
        final_text = think_filter.flush()
        if final_text:
            full_response += final_text
            payload = json.dumps({"type": "token", "text": final_text})
            yield f"data: {payload}\n\n"
                    
        # Determine answer type: only 'document' if we actually had relevant document matches
        answer_type = AnswerType.document if has_document_match else AnswerType.general

        def sanitize_excerpt(text: str, max_length: int = 400) -> str:
            if not text:
                return ""
            # Strip bracketed parser headers: [Page 1 Visual Content & Text: ...], [Uploaded Image Content: ...]
            cleaned = re.sub(r"^\[(?:Page\s*\d+[^\n\]]*|Image\s*\d+[^\n\]]*|Uploaded\s*Image\s*Content)[^:\n]*:?\s*", "", text, flags=re.IGNORECASE)
            # Strip markdown headers like ### Verbatim Text Extraction
            cleaned = re.sub(r"#{1,6}\s*(?:Verbatim\s*Text\s*Extraction|Extracted\s*Text|Visual\s*Diagram\s*Description)[:\s]*\n*", "", cleaned, flags=re.IGNORECASE)
            # Strip page dividers like --- Page 1 ---
            cleaned = re.sub(r"^---\s*Page\s*\d+\s*---\s*", "", cleaned, flags=re.IGNORECASE)
            # Strip decorative logo remarks
            cleaned = re.sub(r"\(Logo:[^\)]*\)", "", cleaned, flags=re.IGNORECASE)
            # Clean standalone brackets
            cleaned = re.sub(r"^\[\s*", "", cleaned)
            if cleaned.endswith("]"):
                cleaned = cleaned[:-1].strip()
            cleaned = cleaned.strip()
            if len(cleaned) <= max_length:
                return cleaned
            # Break cleanly at last space
            truncated = cleaned[:max_length]
            last_space = truncated.rfind(" ")
            if last_space > int(max_length * 0.7):
                truncated = truncated[:last_space]
            return truncated.strip() + "..."

        # Construct sources for DB and client: ONLY include chunks meeting the relevance threshold
        sources_payload = []
        if has_document_match:
            for i, chunk in enumerate(top_chunks):
                score = getattr(chunk, "score", 0.0)
                if score < RELEVANCE_THRESHOLD:
                    continue
                p = chunk.payload
                raw_text = p.get("text") or p.get("chunk_text") or ""
                
                # Extract page number if not already present in payload
                page_num = p.get("page_number")
                if page_num is None:
                    page_match = re.search(r"(?:\[Page\s*|---\s*Page\s*|Page\s*)(\d+)", raw_text, re.IGNORECASE)
                    if page_match:
                        try:
                            page_num = int(page_match.group(1))
                        except (ValueError, TypeError):
                            page_num = None

                cleaned_excerpt = sanitize_excerpt(raw_text, max_length=400)

                sources_payload.append({
                    "document_id": p.get("document_id"),
                    "filename": p.get("filename") or "Document",
                    "page_number": page_num,
                    "excerpt": cleaned_excerpt,
                    "relevance_score": score
                })

        # Yield sources payload
        final_payload = json.dumps({
            "type": "sources",
            "done": True,
            "answer_type": answer_type.value,
            "sources": sources_payload
        })
        yield f"data: {final_payload}\n\n"
        
        # Signal end of stream
        yield "data: [DONE]\n\n"

        # 4. Save assistant message and sources to DB, then update chat timestamp
        from datetime import datetime, timezone
        async with db_session_factory() as db:
            assistant_message = Message(
                chat_id=chat_id,
                user_id=user_id,
                role=MessageRole.assistant,
                content=full_response.strip() if full_response and full_response.strip() else "*(The model was unable to complete the response. Please try again.)*",
                answer_type=answer_type
            )
            db.add(assistant_message)
            await db.commit()
            await db.refresh(assistant_message)

            for src in sources_payload:
                db_source = MessageSource(
                    message_id=assistant_message.id,
                    document_id=src["document_id"],
                    page_number=src["page_number"],
                    relevance_score=src["relevance_score"],
                    excerpt=src["excerpt"]
                )
                db.add(db_source)

            # Update chat's last_message_at so sidebar sorts correctly
            chat_result = await db.execute(select(Chat).where(Chat.id == chat_id))
            chat_obj = chat_result.scalars().first()
            if chat_obj:
                chat_obj.last_message_at = datetime.now(timezone.utc)
                if chat_obj.title in ["New Chat", "New Study Session", "Untitled Chat", ""]:
                    words = query.split()
                    new_title = " ".join(words[:6])
                    if len(words) > 6:
                        new_title += "..."
                    chat_obj.title = new_title
                db.add(chat_obj)

            await db.commit()

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Chat streaming generation error: {e}", exc_info=True)
        safe_error_msg = "An error occurred while generating the response. Please try again."
        error_payload = json.dumps({"error": safe_error_msg})
        yield f"data: {error_payload}\n\n"

@router.post("/")
@router.post("", include_in_schema=False)
async def stream_chat(
    chat_id: str,
    message_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Send a message to a chat and get a streaming response."""
    # 1. Validate chat ownership
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id))
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 2. Fetch history (limit 10)
    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    db_history = result.scalars().all()
    # Reverse to chronological
    db_history.reverse()

    history = [{"role": msg.role.value, "content": msg.content} for msg in db_history]

    # Return SSE Response with proper anti-buffering headers
    return StreamingResponse(
        generate_chat_stream(
            db_session_factory=AsyncSessionLocal,
            chat_id=chat_id,
            user_id=current_user.id,
            query=message_in.content,
            history=history
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

from pydantic import BaseModel

class FeedbackIn(BaseModel):
    rating: int  # 1 for up, -1 for down, 0 to clear
    comment: Optional[str] = None

@router.post("/{message_id}/feedback")
async def submit_feedback(
    chat_id: str,
    message_id: str,
    feedback_in: FeedbackIn,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Save or update thumbs up/down feedback for an assistant message."""
    # Validate chat ownership
    chat_res = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id))
    if not chat_res.scalars().first():
        raise HTTPException(status_code=404, detail="Chat not found")

    msg_res = await db.execute(select(Message).where(Message.id == message_id, Message.chat_id == chat_id))
    msg = msg_res.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    from app.models.message import Feedback
    fb_res = await db.execute(
        select(Feedback).where(Feedback.message_id == message_id, Feedback.user_id == current_user.id)
    )
    existing_fb = fb_res.scalars().first()

    if feedback_in.rating == 0:
        if existing_fb:
            await db.delete(existing_fb)
            await db.commit()
        return {"status": "cleared"}

    if existing_fb:
        existing_fb.rating = feedback_in.rating
        existing_fb.comment = feedback_in.comment
    else:
        new_fb = Feedback(
            message_id=msg.id,
            user_id=current_user.id,
            rating=feedback_in.rating,
            comment=feedback_in.comment
        )
        db.add(new_fb)

    await db.commit()
    return {"status": "ok", "rating": feedback_in.rating}
