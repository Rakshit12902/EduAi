from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import UserProfile
from app.models.chat import Chat
from app.schemas.chat import ChatCreate, ChatUpdate, ChatResponse

router = APIRouter()

@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_in: ChatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    chat = Chat(
        user_id=current_user.id,
        title=chat_in.title,
        description=chat_in.description
    )
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    return chat

@router.get("/", response_model=List[ChatResponse])
async def read_chats(
    skip: int = 0,
    limit: int = 100,
    include_archived: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    query = select(Chat).where(Chat.user_id == current_user.id)
    if not include_archived:
        query = query.where(Chat.is_archived == False)
    
    query = query.order_by(desc(Chat.last_message_at).nulls_last(), desc(Chat.created_at))
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    chats = result.scalars().all()
    return chats

@router.patch("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: uuid.UUID,
    chat_in: ChatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id))
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    update_data = chat_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chat, field, value)
        
    await db.commit()
    await db.refresh(chat)
    return chat

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id))
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    await db.delete(chat)
    await db.commit()
    return None
