"""SwanyThree User Routes — profiles, follow/unfollow, follower lists."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.dependencies import Pagination, get_pagination
from api.middleware.auth import get_current_user
from models.entities import (
    Follower,
    Notification,
    NotificationType,
    User,
    UserBadge,
    UserGamification,
    Badge,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["Users"])

LEVEL_TITLES = {
    1: "Newcomer", 2: "Explorer", 3: "Contributor", 4: "Enthusiast",
    5: "Streamer", 6: "Veteran", 7: "Expert", 8: "Master",
    9: "Legend", 10: "Champion",
}


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class UpdateProfileRequest(BaseModel):
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = Field(None, max_length=2048)


class PublicUserOut(BaseModel):
    id: str
    username: str
    display_name: str | None
    avatar_url: str | None
    bio: str | None
    role: str
    is_verified: bool
    follower_count: int
    following_count: int
    level: int
    level_title: str
    total_xp: int
    badges: list[dict]


class FollowUserOut(BaseModel):
    id: str
    username: str
    display_name: str | None
    avatar_url: str | None
    followed_at: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/{user_id}")
async def get_user_profile(user_id: UUID, db: AsyncSession = Depends(get_db)):
    """Public user profile with gamification level and badges."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    follower_count = (
        await db.execute(select(func.count()).where(Follower.following_id == user.id))
    ).scalar() or 0

    following_count = (
        await db.execute(select(func.count()).where(Follower.follower_id == user.id))
    ).scalar() or 0

    gam_result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == user.id)
    )
    gamification = gam_result.scalar_one_or_none()
    level = gamification.level if gamification else 1
    total_xp = gamification.xp_total if gamification else 0

    badge_rows = (
        await db.execute(
            select(UserBadge, Badge)
            .join(Badge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.user_id == user.id)
            .order_by(UserBadge.earned_at.desc())
        )
    ).all()

    badges = [
        {
            "id": str(ub.id),
            "badge_id": str(b.id),
            "name": b.name,
            "slug": b.slug,
            "description": b.description,
            "icon_url": b.icon_url,
            "tier": b.tier.value if hasattr(b.tier, "value") else str(b.tier),
            "earned_at": ub.earned_at.isoformat() if ub.earned_at else None,
        }
        for ub, b in badge_rows
    ]

    return {
        "success": True,
        "user": PublicUserOut(
            id=str(user.id),
            username=user.username,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            bio=user.bio,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            is_verified=user.is_verified,
            follower_count=follower_count,
            following_count=following_count,
            level=level,
            level_title=LEVEL_TITLES.get(level, f"Level {level}"),
            total_xp=total_xp,
            badges=badges,
        ).model_dump(),
    }


@router.patch("/me")
async def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile fields."""
    updated_fields = {}

    if req.display_name is not None:
        current_user.display_name = req.display_name
        updated_fields["display_name"] = req.display_name

    if req.bio is not None:
        current_user.bio = req.bio
        updated_fields["bio"] = req.bio

    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url
        updated_fields["avatar_url"] = req.avatar_url

    if not updated_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db.commit()
    await db.refresh(current_user)

    logger.info("User %s updated profile: %s", current_user.username, list(updated_fields.keys()))

    return {
        "success": True,
        "updated_fields": list(updated_fields.keys()),
        "user": {
            "id": str(current_user.id),
            "username": current_user.username,
            "display_name": current_user.display_name,
            "avatar_url": current_user.avatar_url,
            "bio": current_user.bio,
        },
    }


@router.post("/{user_id}/follow", status_code=201)
async def follow_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Follow a user, create a notification for them."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target_result = await db.execute(select(User).where(User.id == user_id))
    target_user = target_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.execute(
        select(Follower).where(
            Follower.follower_id == current_user.id,
            Follower.following_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already following this user")

    follow = Follower(follower_id=current_user.id, following_id=user_id)
    db.add(follow)

    notification = Notification(
        user_id=user_id,
        type=NotificationType.follow,
        title="New Follower",
        body=f"{current_user.display_name or current_user.username} started following you",
        action_url=f"/users/{current_user.id}",
        metadata_json={"follower_id": str(current_user.id), "follower_username": current_user.username},
    )
    db.add(notification)

    await db.commit()

    new_follower_count = (
        await db.execute(select(func.count()).where(Follower.following_id == user_id))
    ).scalar() or 0

    logger.info("User %s followed %s", current_user.username, target_user.username)

    return {
        "success": True,
        "message": f"Now following {target_user.username}",
        "follower_count": new_follower_count,
    }


@router.delete("/{user_id}/follow")
async def unfollow_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unfollow a user."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot unfollow yourself")

    result = await db.execute(
        select(Follower).where(
            Follower.follower_id == current_user.id,
            Follower.following_id == user_id,
        )
    )
    follow_record = result.scalar_one_or_none()
    if not follow_record:
        raise HTTPException(status_code=404, detail="Not following this user")

    await db.delete(follow_record)
    await db.commit()

    new_follower_count = (
        await db.execute(select(func.count()).where(Follower.following_id == user_id))
    ).scalar() or 0

    logger.info("User %s unfollowed user %s", current_user.username, user_id)

    return {
        "success": True,
        "message": "Unfollowed successfully",
        "follower_count": new_follower_count,
    }


@router.get("/{user_id}/followers")
async def get_followers(
    user_id: UUID,
    pagination: Pagination = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    """Paginated list of users who follow the specified user."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    total = (
        await db.execute(select(func.count()).where(Follower.following_id == user_id))
    ).scalar() or 0

    rows = (
        await db.execute(
            select(Follower, User)
            .join(User, Follower.follower_id == User.id)
            .where(Follower.following_id == user_id)
            .order_by(Follower.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
    ).all()

    followers = [
        FollowUserOut(
            id=str(u.id),
            username=u.username,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
            followed_at=f_.created_at.isoformat() if f_.created_at else "",
        ).model_dump()
        for f_, u in rows
    ]

    return {
        "success": True,
        "followers": followers,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
    }


@router.get("/{user_id}/following")
async def get_following(
    user_id: UUID,
    pagination: Pagination = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    """Paginated list of users the specified user is following."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    total = (
        await db.execute(select(func.count()).where(Follower.follower_id == user_id))
    ).scalar() or 0

    rows = (
        await db.execute(
            select(Follower, User)
            .join(User, Follower.following_id == User.id)
            .where(Follower.follower_id == user_id)
            .order_by(Follower.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
    ).all()

    following = [
        FollowUserOut(
            id=str(u.id),
            username=u.username,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
            followed_at=f_.created_at.isoformat() if f_.created_at else "",
        ).model_dump()
        for f_, u in rows
    ]

    return {
        "success": True,
        "following": following,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
    }
