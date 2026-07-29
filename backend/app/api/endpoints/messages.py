import json
import asyncio
from typing import List, Dict, Any
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
        .options(selectinload(Message.sources))
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    
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
        # Fetch the most recent document's filename in the chat to prioritize it if the user query is vague
        latest_doc_filename = ""
        async with db_session_factory() as db:
            from app.models.document import Document
            doc_res = await db.execute(
                select(Document)
                .where(Document.chat_id == chat_id)
                .order_by(Document.created_at.desc())
                .limit(1)
            )
            latest_doc = doc_res.scalars().first()
            if latest_doc:
                latest_doc_filename = latest_doc.filename

        # Embed query
        query_vector = await embed_query(query)
        
        # Retrieve chunks from Qdrant
        search_query = query
        if latest_doc_filename and latest_doc_filename.lower() not in query.lower():
            # Append filename to internal retrieval query to trigger explicit filename matching
            search_query = f"{query} {latest_doc_filename}"
            
        retrieved_chunks = await retrieve_chunks(user_id=str(user_id), chat_id=str(chat_id), query_vector=query_vector, query=search_query, top_k=20)
        
        # Rerank chunks
        top_chunks = await rerank_chunks(query=query, chunks=retrieved_chunks, top_n=5)
        
        # Fetch user settings for model, temperature & language
        user_model = "llama-3.3-70b-versatile"
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

        # Build prompt with user language preference
        messages = build_prompt(query=query, context_chunks=top_chunks, history=history, language=user_lang)

        # 3. Stream from Groq API (with automatic fallback if model is rate limited)
        try:
            stream = await groq_client.chat.completions.create(
                messages=messages,
                model=user_model,
                temperature=user_temp,
                max_tokens=2048,
                stream=True
            )
        except Exception as groq_err:
            import logging
            logging.getLogger(__name__).warning(f"Groq API failed ({groq_err}). Falling back to Gemini Flash...")
            
            if not settings.GEMINI_API_KEY:
                raise Exception("Groq failed and no Gemini fallback API key provided.")
                
            from google import genai
            gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            # Format messages for Gemini (it prefers a single prompt string if we aren't doing strict multi-turn parts)
            gemini_prompt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
            
            # Use the asynchronous client under .aio
            response = gemini_client.aio.models.generate_content_stream(
                model='gemini-2.0-flash',
                contents=gemini_prompt
            )
            
            stream = response

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
                    
        # Determine answer type directly from retrieved chunks
        answer_type = AnswerType.document if top_chunks else AnswerType.general
        
        # If chunks were provided but the AI did NOT cite a source, it means it used general knowledge.
        if top_chunks and "source:" not in full_response.lower():
            answer_type = AnswerType.general
            top_chunks = []

        # Construct sources for DB and client
        sources_payload = []
        for i, chunk in enumerate(top_chunks):
            p = chunk.payload
            sources_payload.append({
                "document_id": p.get("document_id"),
                "filename": p.get("filename"),
                "page_number": p.get("page_number"),
                "excerpt": p.get("text", "")[:200] + "...",
                "relevance_score": getattr(chunk, "score", 0.0)
            })

        # Yield final payload
        final_payload = json.dumps({
            "type": "sources",
            "done": True,
            "answer_type": answer_type.value,
            "sources": sources_payload
        })
        yield f"data: {final_payload}\n\n"

        # 4. Save assistant message and sources to DB
        async with db_session_factory() as db:
            assistant_message = Message(
                chat_id=chat_id,
                user_id=user_id,
                role=MessageRole.assistant,
                content=full_response,
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
            await db.commit()

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_payload = json.dumps({"error": str(e)})
        yield f"data: {error_payload}\n\n"

@router.post("/")
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

    # Return SSE Response
    return StreamingResponse(
        generate_chat_stream(
            db_session_factory=AsyncSessionLocal,
            chat_id=chat_id,
            user_id=current_user.id,
            query=message_in.content,
            history=history
        ),
        media_type="text/event-stream"
    )
