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

router = APIRouter()

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
        # Embed query
        query_vector = await embed_query(query)
        
        # Retrieve chunks from Qdrant
        retrieved_chunks = await retrieve_chunks(user_id=str(user_id), chat_id=str(chat_id), query_vector=query_vector, query=query, top_k=20)
        
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
                max_tokens=1024,
                stream=True
            )
        except Exception as groq_err:
            if "rate_limit" in str(groq_err).lower() or "429" in str(groq_err):
                import logging
                logging.getLogger(__name__).warning(f"Model {user_model} rate limited. Falling back to llama-3.1-8b-instant...")
                stream = await groq_client.chat.completions.create(
                    messages=messages,
                    model="llama-3.1-8b-instant",
                    temperature=user_temp,
                    max_tokens=1024,
                    stream=True
                )
            else:
                raise groq_err

        full_response = ""
        
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                full_response += content
                payload = json.dumps({"type": "token", "text": content})
                yield f"data: {payload}\n\n"
                
        # Determine answer type directly from retrieved chunks
        answer_type = AnswerType.document if top_chunks else AnswerType.general

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
