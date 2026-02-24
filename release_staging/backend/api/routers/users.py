"""Users router — profile retrieval and updates."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserRead(BaseModel):
    id: str
    username: str
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    role: str
    is_verified: bool
    is_active: bool

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _user_to_dict(u: User) -> dict:
    return {
        "id": str(u.id),
        "username": u.username,
        "email": u.email,
        "display_name": u.display_name,
        "avatar_url": u.avatar_url,
        "bio": u.bio,
        "role": str(u.role),
        "is_verified": bool(u.is_verified),
        "is_active": bool(u.is_active),
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve the current authenticated user's full profile."""
    return _user_to_dict(current_user)


@router.patch("/me")
async def update_me(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's profile fields."""
    if data.display_name is not None:
        current_user.display_name = data.display_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    await db.commit()
    await db.refresh(current_user)
    return _user_to_dict(current_user)


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a public user profile by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": str(user.id),
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "role": str(user.role),
    }


@router.get("/", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List users — admin view."""
    result = await db.execute(select(User).limit(50))
    return [_user_to_dict(u) for u in result.scalars().all()]
