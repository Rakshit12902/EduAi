from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.api.deps import get_db, get_current_user
from app.models.user import UserProfile
from app.models.settings import UserSettings
from app.schemas.settings import UserSettingsResponse, UserSettingsUpdate

router = APIRouter()

@router.get("/", response_model=UserSettingsResponse)
async def get_user_settings(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Fetch current user's settings or create default settings if none exist."""
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalars().first()
    
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    # Inject full_name from the user model into the response
    settings_dict = {c.name: getattr(settings, c.name) for c in settings.__table__.columns}
    settings_dict["full_name"] = current_user.full_name
    return settings_dict

@router.patch("/", response_model=UserSettingsResponse)
async def update_user_settings(
    settings_in: UserSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Update current user's settings."""
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalars().first()
    
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        
    update_data = settings_in.model_dump(exclude_unset=True)
    
    # Handle full_name update separately on the UserProfile
    if "full_name" in update_data:
        current_user.full_name = update_data.pop("full_name")
        db.add(current_user)
        
    # Apply remaining updates to UserSettings
    for field, value in update_data.items():
        setattr(settings, field, value)
        
    await db.commit()
    await db.refresh(settings)
    await db.refresh(current_user)
    
    settings_dict = {c.name: getattr(settings, c.name) for c in settings.__table__.columns}
    settings_dict["full_name"] = current_user.full_name
    return settings_dict
