import uuid
from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.core.auth import verify_supabase_token
from app.models.user import UserProfile

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(verify_supabase_token)
) -> UserProfile:
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject (sub) claim",
        )
    
    try:
        user_uuid = uuid.UUID(str(user_id_str))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format in token",
        )

    result = await db.execute(select(UserProfile).where(UserProfile.id == user_uuid))
    user = result.scalars().first()
    
    if not user:
        # Auto-create UserProfile if it does not exist yet in the database
        email = payload.get("email") or f"{user_id_str}@example.com"
        user_meta = payload.get("user_metadata", {}) or {}
        full_name = user_meta.get("full_name") or user_meta.get("name") or email.split("@")[0]
        avatar_url = user_meta.get("avatar_url") or user_meta.get("picture")

        user = UserProfile(
            id=user_uuid,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except Exception as e:
            await db.rollback()
            # Re-fetch in case of concurrent insert (race condition on first login)
            result = await db.execute(select(UserProfile).where(UserProfile.id == user_uuid))
            user = result.scalars().first()
            if not user:
                raise HTTPException(status_code=500, detail=f"Failed to auto-create user profile: {str(e)}")

    return user
