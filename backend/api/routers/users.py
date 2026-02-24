"""Users router — profile retrieval and updates."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User, CreatorPanel

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


class PanelCreate(BaseModel):
    title: str
    content: str
    order: int = 0


class PanelUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class PanelRead(BaseModel):
    id: str
    title: str
    content: str
    order: int
    is_active: bool

    class Config:
        from_attributes = True


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
    """Get a public user profile by ID including their info panels."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # Fetch active panels
    p_result = await db.execute(
        select(CreatorPanel)
        .where(CreatorPanel.user_id == user_id, CreatorPanel.is_active == True)
        .order_by(CreatorPanel.order.asc())
    )
    panels = p_result.scalars().all()

    return {
        "id": str(user.id),
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "role": str(user.role),
        "panels": [
            {"id": p.id, "title": p.title, "content": p.content}
            for p in panels
        ]
    }


# ── Panel Management (Creator Only) ──────────────────────────────────────────

@router.get("/me/panels", response_model=List[PanelRead])
async def list_my_panels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all panels for the current creator."""
    result = await db.execute(
        select(CreatorPanel)
        .where(CreatorPanel.user_id == str(current_user.id))
        .order_by(CreatorPanel.order.asc())
    )
    return result.scalars().all()


@router.post("/me/panels", response_model=PanelRead, status_code=status.HTTP_201_CREATED)
async def create_panel(
    data: PanelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new info panel."""
    new_panel = CreatorPanel(
        user_id=str(current_user.id),
        title=data.title,
        content=data.content,
        order=data.order
    )
    db.add(new_panel)
    await db.commit()
    await db.refresh(new_panel)
    return new_panel


@router.patch("/me/panels/{panel_id}", response_model=PanelRead)
async def update_panel(
    panel_id: str,
    data: PanelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing info panel."""
    result = await db.execute(
        select(CreatorPanel)
        .where(CreatorPanel.id == panel_id, CreatorPanel.user_id == str(current_user.id))
    )
    panel = result.scalars().first()
    if not panel:
        raise HTTPException(status_code=404, detail="Panel not found.")
    
    if data.title is not None: panel.title = data.title
    if data.content is not None: panel.content = data.content
    if data.order is not None: panel.order = data.order
    if data.is_active is not None: panel.is_active = data.is_active

    await db.commit()
    await db.refresh(panel)
    return panel


@router.delete("/me/panels/{panel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_panel(
    panel_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an info panel."""
    result = await db.execute(
        select(CreatorPanel)
        .where(CreatorPanel.id == panel_id, CreatorPanel.user_id == str(current_user.id))
    )
    panel = result.scalars().first()
    if not panel:
        raise HTTPException(status_code=404, detail="Panel not found.")
    
    await db.delete(panel)
    await db.commit()


@router.get("/", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List users — admin view."""
    result = await db.execute(select(User).limit(50))
    return [_user_to_dict(u) for u in result.scalars().all()]
