"""SwanyThree Authentication Routes."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.middleware.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user,
)
from models.entities import User, UserGamification, UserSettings, Follower

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str | None = Field(None, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    display_name: str | None
    avatar_url: str | None
    bio: str | None
    role: str
    is_verified: bool
    follower_count: int
    following_count: int


class AuthResponse(BaseModel):
    success: bool = True
    user: UserOut
    access_token: str
    refresh_token: str


async def _build_user_out(user: User, db: AsyncSession) -> UserOut:
    """Build a UserOut response with follower/following counts from the DB."""
    from sqlalchemy import func

    follower_count_result = await db.execute(
        select(func.count()).where(Follower.following_id == user.id)
    )
    follower_count = follower_count_result.scalar() or 0

    following_count_result = await db.execute(
        select(func.count()).where(Follower.follower_id == user.id)
    )
    following_count = following_count_result.scalar() or 0

    return UserOut(
        id=str(user.id), email=user.email, username=user.username,
        display_name=user.display_name, avatar_url=user.avatar_url,
        bio=user.bio, role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_verified=user.is_verified,
        follower_count=follower_count, following_count=following_count,
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        email=req.email,
        username=req.username,
        display_name=req.display_name or req.username,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    await db.flush()

    gamification = UserGamification(user_id=user.id)
    db.add(gamification)

    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        str(user.id),
        user.role.value if hasattr(user.role, "value") else str(user.role),
    )
    refresh_token = create_refresh_token(str(user.id))

    user_out = await _build_user_out(user, db)

    logger.info("User registered: %s (%s)", user.email, user.username)

    return AuthResponse(
        user=user_out,
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive tokens."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(
        str(user.id),
        user.role.value if hasattr(user.role, "value") else str(user.role),
    )
    refresh_token = create_refresh_token(str(user.id))

    user_out = await _build_user_out(user, db)

    return AuthResponse(
        user=user_out,
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh")
async def refresh_token(req: RefreshRequest):
    """Get new access token using refresh token."""
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        access_token = create_access_token(payload["sub"], payload.get("role", "creator"))
        return {"success": True, "access_token": access_token}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Invalidate current session."""
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user profile with gamification summary."""
    from sqlalchemy import func

    result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == current_user.id)
    )
    gamification = result.scalar_one_or_none()

    follower_count_result = await db.execute(
        select(func.count()).where(Follower.following_id == current_user.id)
    )
    follower_count = follower_count_result.scalar() or 0

    following_count_result = await db.execute(
        select(func.count()).where(Follower.follower_id == current_user.id)
    )
    following_count = following_count_result.scalar() or 0

    badge_count = 0
    if gamification:
        from models.entities import UserBadge
        badge_result = await db.execute(
            select(func.count()).where(UserBadge.user_id == current_user.id)
        )
        badge_count = badge_result.scalar() or 0

    level_titles = {
        1: "Newcomer", 2: "Explorer", 3: "Contributor", 4: "Enthusiast",
        5: "Streamer", 6: "Veteran", 7: "Expert", 8: "Master",
        9: "Legend", 10: "Champion",
    }
    level = gamification.level if gamification else 1
    level_title = level_titles.get(level, f"Level {level}")

    return {
        "success": True,
        "user": {
            "id": str(current_user.id), "email": current_user.email,
            "username": current_user.username, "display_name": current_user.display_name,
            "avatar_url": current_user.avatar_url, "bio": current_user.bio,
            "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
            "is_verified": current_user.is_verified,
            "follower_count": follower_count,
            "following_count": following_count,
        },
        "gamification": {
            "total_xp": gamification.xp_total if gamification else 0,
            "level": level,
            "level_title": level_title,
            "current_streak": gamification.current_streak_days if gamification else 0,
            "badge_count": badge_count,
        } if gamification else None,
    }
