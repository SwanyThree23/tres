"""SwanyThree Gamification Routes — XP, streaks, challenges, badges, leaderboard."""

import logging
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.database import get_db
from api.dependencies import Pagination, get_pagination
from api.middleware.auth import get_current_user
from models.entities import (
    Badge,
    ChallengeStatus,
    User,
    UserBadge,
    UserChallengeProgress,
    UserGamification,
    WeeklyChallenge,
    XPAction,
    XPHistory,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/gamification", tags=["Gamification"])

LEVEL_TITLES = {
    1: "Newcomer", 2: "Explorer", 3: "Contributor", 4: "Enthusiast",
    5: "Streamer", 6: "Veteran", 7: "Expert", 8: "Master",
    9: "Legend", 10: "Champion",
}

XP_PER_ACTION = {
    XPAction.stream_start: 50,
    XPAction.stream_minute: 2,
    XPAction.chat_message: 5,
    XPAction.follow: 10,
    XPAction.donate: 25,
    XPAction.badge_earned: 100,
    XPAction.challenge_complete: 200,
    XPAction.daily_login: 15,
    XPAction.post_create: 20,
    XPAction.post_like: 3,
}

XP_PER_LEVEL = 500


def _calculate_level(xp_total: int) -> int:
    """Calculate level from total XP. Level = floor(xp / 500) + 1, capped at 100."""
    return min(max((xp_total // XP_PER_LEVEL) + 1, 1), 100)


def _get_streak_multiplier(streak_days: int) -> float:
    """Return the XP multiplier based on streak length."""
    if streak_days >= 60:
        return settings.XP_STREAK_60
    elif streak_days >= 30:
        return settings.XP_STREAK_30
    elif streak_days >= 14:
        return settings.XP_STREAK_14
    elif streak_days >= 7:
        return settings.XP_STREAK_7
    return 1.0


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class AwardXPRequest(BaseModel):
    action: str = Field(..., description="XP action type")
    metadata: dict | None = None


class ChallengeProgressRequest(BaseModel):
    challenge_id: UUID
    increment: int = Field(default=1, ge=1)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/profile")
async def get_gamification_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full gamification profile for the current user."""
    gam_result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == current_user.id)
    )
    gamification = gam_result.scalar_one_or_none()

    if not gamification:
        gamification = UserGamification(user_id=current_user.id)
        db.add(gamification)
        await db.commit()
        await db.refresh(gamification)

    badge_count = (
        await db.execute(
            select(func.count()).where(UserBadge.user_id == current_user.id)
        )
    ).scalar() or 0

    recent_xp = (
        await db.execute(
            select(XPHistory)
            .where(XPHistory.user_id == current_user.id)
            .order_by(XPHistory.created_at.desc())
            .limit(10)
        )
    ).scalars().all()

    xp_history = [
        {
            "id": str(entry.id),
            "action": entry.action.value if hasattr(entry.action, "value") else str(entry.action),
            "xp_amount": entry.xp_amount,
            "multiplier": entry.multiplier,
            "created_at": entry.created_at.isoformat() if entry.created_at else "",
        }
        for entry in recent_xp
    ]

    level = gamification.level
    xp_for_current_level = (level - 1) * XP_PER_LEVEL
    xp_for_next_level = level * XP_PER_LEVEL
    xp_progress = gamification.xp_total - xp_for_current_level

    return {
        "success": True,
        "profile": {
            "user_id": str(current_user.id),
            "xp_total": gamification.xp_total,
            "level": level,
            "level_title": LEVEL_TITLES.get(level, f"Level {level}"),
            "xp_progress": xp_progress,
            "xp_to_next_level": XP_PER_LEVEL,
            "current_streak_days": gamification.current_streak_days,
            "longest_streak_days": gamification.longest_streak_days,
            "streak_multiplier": _get_streak_multiplier(gamification.current_streak_days),
            "last_active_date": gamification.last_active_date.isoformat() if gamification.last_active_date else None,
            "streams_count": gamification.streams_count,
            "total_stream_minutes": gamification.total_stream_minutes,
            "badge_count": badge_count,
        },
        "recent_xp": xp_history,
    }


@router.post("/award-xp")
async def award_xp(
    req: AwardXPRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Award XP for a specific action."""
    try:
        action = XPAction(req.action)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Valid actions: {[a.value for a in XPAction]}",
        )

    base_xp = XP_PER_ACTION.get(action, 10)

    gam_result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == current_user.id)
    )
    gamification = gam_result.scalar_one_or_none()

    if not gamification:
        gamification = UserGamification(user_id=current_user.id)
        db.add(gamification)
        await db.flush()

    multiplier = _get_streak_multiplier(gamification.current_streak_days)
    awarded_xp = int(base_xp * multiplier)

    gamification.xp_total += awarded_xp

    new_level = _calculate_level(gamification.xp_total)
    leveled_up = new_level > gamification.level
    gamification.level = new_level

    xp_entry = XPHistory(
        user_id=current_user.id,
        action=action,
        xp_amount=awarded_xp,
        multiplier=multiplier,
        metadata_json=req.metadata,
    )
    db.add(xp_entry)

    await db.commit()

    result = {
        "success": True,
        "xp_awarded": awarded_xp,
        "base_xp": base_xp,
        "multiplier": multiplier,
        "new_total": gamification.xp_total,
        "level": gamification.level,
        "level_title": LEVEL_TITLES.get(new_level, f"Level {new_level}"),
    }

    if leveled_up:
        result["leveled_up"] = True
        result["new_level"] = new_level

        from models.entities import Notification, NotificationType
        notif = Notification(
            user_id=current_user.id,
            type=NotificationType.badge,
            title="Level Up!",
            body=f"Congratulations! You reached Level {new_level} - {LEVEL_TITLES.get(new_level, '')}",
        )
        db.add(notif)
        await db.commit()

    logger.info(
        "XP awarded to %s: %d (%s, x%.1f)",
        current_user.username, awarded_xp, action.value, multiplier,
    )

    return result


@router.post("/update-streak")
async def update_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the daily login streak for the current user."""
    gam_result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == current_user.id)
    )
    gamification = gam_result.scalar_one_or_none()

    if not gamification:
        gamification = UserGamification(user_id=current_user.id)
        db.add(gamification)
        await db.flush()

    today = date.today()

    if gamification.last_active_date == today:
        return {
            "success": True,
            "message": "Streak already updated today",
            "current_streak": gamification.current_streak_days,
            "longest_streak": gamification.longest_streak_days,
            "multiplier": _get_streak_multiplier(gamification.current_streak_days),
        }

    yesterday = today - timedelta(days=1)

    if gamification.last_active_date == yesterday:
        gamification.current_streak_days += 1
    elif gamification.last_active_date and gamification.last_active_date < yesterday:
        gamification.current_streak_days = 1
    else:
        gamification.current_streak_days = 1

    if gamification.current_streak_days > gamification.longest_streak_days:
        gamification.longest_streak_days = gamification.current_streak_days

    gamification.last_active_date = today

    multiplier = _get_streak_multiplier(gamification.current_streak_days)
    daily_xp = int(XP_PER_ACTION[XPAction.daily_login] * multiplier)
    gamification.xp_total += daily_xp

    new_level = _calculate_level(gamification.xp_total)
    gamification.level = new_level

    xp_entry = XPHistory(
        user_id=current_user.id,
        action=XPAction.daily_login,
        xp_amount=daily_xp,
        multiplier=multiplier,
        metadata_json={"streak_days": gamification.current_streak_days},
    )
    db.add(xp_entry)

    await db.commit()

    logger.info(
        "Streak updated for %s: day %d (x%.1f, +%d XP)",
        current_user.username, gamification.current_streak_days, multiplier, daily_xp,
    )

    return {
        "success": True,
        "current_streak": gamification.current_streak_days,
        "longest_streak": gamification.longest_streak_days,
        "multiplier": multiplier,
        "xp_awarded": daily_xp,
        "level": gamification.level,
    }


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = Query(default="all", pattern=r"^(week|month|all)$"),
    pagination: Pagination = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    """Top users by XP, optionally filtered by time period."""
    if period == "all":
        query = (
            select(UserGamification, User)
            .join(User, UserGamification.user_id == User.id)
            .where(User.is_active == True)  # noqa: E712
            .order_by(UserGamification.xp_total.desc())
        )

        count_q = (
            select(func.count())
            .select_from(UserGamification)
            .join(User, UserGamification.user_id == User.id)
            .where(User.is_active == True)  # noqa: E712
        )
        total = (await db.execute(count_q)).scalar() or 0

        result = await db.execute(query.offset(pagination.offset).limit(pagination.limit))
        rows = result.all()

        leaders = []
        for rank, (gam, user) in enumerate(rows, start=pagination.offset + 1):
            leaders.append({
                "rank": rank,
                "user_id": str(user.id),
                "username": user.username,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "xp_total": gam.xp_total,
                "level": gam.level,
                "level_title": LEVEL_TITLES.get(gam.level, f"Level {gam.level}"),
                "streams_count": gam.streams_count,
            })
    else:
        now = datetime.now(timezone.utc)
        if period == "week":
            since = now - timedelta(weeks=1)
        else:
            since = now - timedelta(days=30)

        xp_subquery = (
            select(
                XPHistory.user_id,
                func.sum(XPHistory.xp_amount).label("period_xp"),
            )
            .where(XPHistory.created_at >= since)
            .group_by(XPHistory.user_id)
            .subquery()
        )

        query = (
            select(User, xp_subquery.c.period_xp)
            .join(xp_subquery, User.id == xp_subquery.c.user_id)
            .where(User.is_active == True)  # noqa: E712
            .order_by(xp_subquery.c.period_xp.desc())
        )

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar() or 0

        result = await db.execute(query.offset(pagination.offset).limit(pagination.limit))
        rows = result.all()

        leaders = []
        for rank, (user, period_xp) in enumerate(rows, start=pagination.offset + 1):
            leaders.append({
                "rank": rank,
                "user_id": str(user.id),
                "username": user.username,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "xp_total": int(period_xp),
                "level": None,
                "level_title": None,
                "streams_count": None,
            })

    return {
        "success": True,
        "period": period,
        "leaderboard": leaders,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
    }


@router.get("/challenges")
async def get_challenges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current active challenges with the user's progress."""
    now = datetime.now(timezone.utc)

    challenges_result = await db.execute(
        select(WeeklyChallenge).where(
            WeeklyChallenge.status == ChallengeStatus.active,
            WeeklyChallenge.starts_at <= now,
            WeeklyChallenge.ends_at >= now,
        ).order_by(WeeklyChallenge.ends_at.asc())
    )
    challenges = challenges_result.scalars().all()

    items = []
    for challenge in challenges:
        progress_result = await db.execute(
            select(UserChallengeProgress).where(
                UserChallengeProgress.user_id == current_user.id,
                UserChallengeProgress.challenge_id == challenge.id,
            )
        )
        progress = progress_result.scalar_one_or_none()

        current_value = progress.current_value if progress else 0
        is_completed = progress.is_completed if progress else False

        items.append({
            "id": str(challenge.id),
            "title": challenge.title,
            "description": challenge.description,
            "xp_reward": challenge.xp_reward,
            "goal_value": challenge.goal_value,
            "current_value": current_value,
            "progress_pct": min(round((current_value / max(challenge.goal_value, 1)) * 100, 1), 100.0),
            "is_completed": is_completed,
            "starts_at": challenge.starts_at.isoformat(),
            "ends_at": challenge.ends_at.isoformat(),
            "time_remaining_hours": max(round((challenge.ends_at - now).total_seconds() / 3600, 1), 0),
        })

    return {"success": True, "challenges": items, "total": len(items)}


@router.post("/challenge-progress")
async def update_challenge_progress(
    req: ChallengeProgressRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Increment progress on a challenge. Auto-complete and award XP when goal is met."""
    challenge_result = await db.execute(
        select(WeeklyChallenge).where(WeeklyChallenge.id == req.challenge_id)
    )
    challenge = challenge_result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    now = datetime.now(timezone.utc)
    if challenge.status != ChallengeStatus.active:
        raise HTTPException(status_code=400, detail="Challenge is not active")
    if now < challenge.starts_at or now > challenge.ends_at:
        raise HTTPException(status_code=400, detail="Challenge is not within its active period")

    progress_result = await db.execute(
        select(UserChallengeProgress).where(
            UserChallengeProgress.user_id == current_user.id,
            UserChallengeProgress.challenge_id == req.challenge_id,
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        progress = UserChallengeProgress(
            user_id=current_user.id,
            challenge_id=req.challenge_id,
            current_value=0,
        )
        db.add(progress)
        await db.flush()

    if progress.is_completed:
        return {
            "success": True,
            "message": "Challenge already completed",
            "current_value": progress.current_value,
            "goal_value": challenge.goal_value,
            "is_completed": True,
        }

    progress.current_value += req.increment

    just_completed = False
    xp_awarded = 0

    if progress.current_value >= challenge.goal_value:
        progress.is_completed = True
        progress.completed_at = now
        just_completed = True

        gam_result = await db.execute(
            select(UserGamification).where(UserGamification.user_id == current_user.id)
        )
        gamification = gam_result.scalar_one_or_none()
        if gamification:
            multiplier = _get_streak_multiplier(gamification.current_streak_days)
            xp_awarded = int(challenge.xp_reward * multiplier)
            gamification.xp_total += xp_awarded
            gamification.level = _calculate_level(gamification.xp_total)

            xp_entry = XPHistory(
                user_id=current_user.id,
                action=XPAction.challenge_complete,
                xp_amount=xp_awarded,
                multiplier=multiplier,
                metadata_json={"challenge_id": str(challenge.id), "challenge_title": challenge.title},
            )
            db.add(xp_entry)

        from models.entities import Notification, NotificationType
        notif = Notification(
            user_id=current_user.id,
            type=NotificationType.challenge,
            title="Challenge Complete!",
            body=f"You completed '{challenge.title}' and earned {xp_awarded} XP!",
        )
        db.add(notif)

    await db.commit()

    return {
        "success": True,
        "current_value": progress.current_value,
        "goal_value": challenge.goal_value,
        "is_completed": progress.is_completed,
        "just_completed": just_completed,
        "xp_awarded": xp_awarded,
    }


@router.get("/badges")
async def list_all_badges(db: AsyncSession = Depends(get_db)):
    """List all available badges on the platform."""
    result = await db.execute(
        select(Badge).order_by(Badge.tier.asc(), Badge.name.asc())
    )
    badges = result.scalars().all()

    items = [
        {
            "id": str(b.id),
            "name": b.name,
            "slug": b.slug,
            "description": b.description,
            "icon_url": b.icon_url,
            "tier": b.tier.value if hasattr(b.tier, "value") else str(b.tier),
            "xp_reward": b.xp_reward,
            "criteria": b.criteria,
        }
        for b in badges
    ]

    return {"success": True, "badges": items, "total": len(items)}


@router.get("/badges/mine")
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all badges earned by the current user."""
    result = await db.execute(
        select(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.earned_at.desc())
    )
    rows = result.all()

    badges = [
        {
            "id": str(ub.id),
            "badge_id": str(b.id),
            "name": b.name,
            "slug": b.slug,
            "description": b.description,
            "icon_url": b.icon_url,
            "tier": b.tier.value if hasattr(b.tier, "value") else str(b.tier),
            "xp_reward": b.xp_reward,
            "earned_at": ub.earned_at.isoformat() if ub.earned_at else "",
        }
        for ub, b in rows
    ]

    return {"success": True, "badges": badges, "total": len(badges)}
