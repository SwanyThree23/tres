from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User
from pydantic import BaseModel, EmailStr

router = APIRouter()

class UserRead(BaseModel):
    id: str
    username: str
    email: str
    display_name: str | None
    role: str

    class Config:
        from_attributes = True

@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve the current authenticated user's profile."""
    return current_user

@router.get("/", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users (Admin only ideally, but keeping it simple for now)."""
    result = await db.execute(select(User).limit(10))
    return result.scalars().all()
