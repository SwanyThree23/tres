"""SwanyThree Gamification Engine — XP system, streaks, badges, and challenges.

Implements the Hooked Model: Trigger → Action → Variable Reward → Investment
"""

import logging
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select, func, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.entities import (
    UserGamification, XPHistory, Badge, UserBadge,
    WeeklyChallenge, UserChallengeProgress, User,
)

logger = logging.getLogger(__name__)

# ── XP Action Constants ─────────────────────────────────────────────
XP_ACTIONS = {
    "START_STREAM": 50,
    "STREAM_30_MIN": 100,
    "STREAM_60_MIN": 200,
    "STREAM_120_MIN": 500,
    "FIRST_VIEWER": 25,
    "REACH_10_VIEWERS": 100,
    "REACH_50_VIEWERS": 250,
    "REACH_100_VIEWERS": 500,
    "SEND_TIP": 20,
    "RECEIVE_TIP": 30,
    "FIRST_TIP_RECEIVED": 100,
    "EARN_100": 500,
    "EARN_1000": 2000,
    "NEW_FOLLOWER": 10,
    "COMPLETE_CHALLENGE": 150,
    "DAILY_LOGIN": 15,
    "SHARE_STREAM": 20,
}

# ── Level Definitions ────────────────────────────────────────────────
LEVELS = [
    (1, "Newcomer", 0),
    (2, "Starter", 100),
    (3, "Broadcaster", 300),
    (4, "Streamer", 600),
    (5, "Entertainer", 1000),
    (6, "Performer", 2000),
    (7, "Showrunner", 3500),
    (8, "Star", 5500),
    (9, "Superstar", 8000),
    (10, "Elite", 12000),
    (11, "Champion", 18000),
    (12, "Master", 28000),
    (13, "Grandmaster", 42000),
    (14, "Legend", 65000),
    (15, "Legendary Icon", 100000),
]

# ── Streak Multipliers ──────────────────────────────────────────────
STREAK_MULTIPLIERS = {
    60: 3.0,
    30: 2.5,
    14: 2.0,
    7: 1.5,
}


class GamificationEngine:
    """Core gamification logic for XP, streaks, badges, and challenges."""

    def get_level_for_xp(self, total_xp: int) -> tuple[int, str, int]:
        """Determine level, title, and next level threshold for given XP.

        Returns:
            (level, title, next_threshold) — next_threshold is 0 if max level
        """
        current_level = 1
        current_title = "Newcomer"
        next_threshold = LEVELS[1][2] if len(LEVELS) > 1 else 0

        for i, (level, title, threshold) in enumerate(LEVELS):
            if total_xp >= threshold:
                current_level = level
                current_title = title
                if i + 1 < len(LEVELS):
                    next_threshold = LEVELS[i + 1][2]
                else:
                    next_threshold = 0

        return current_level, current_title, next_threshold

    def get_streak_multiplier(self, streak_days: int) -> float:
        """Calculate streak multiplier based on consecutive days."""
        for threshold, mult in sorted(STREAK_MULTIPLIERS.items(), reverse=True):
            if streak_days >= threshold:
                return mult
        return 1.0

    async def award_xp(self, db: AsyncSession, user_id: str, action: str,
                       stream_id: str | None = None, metadata: dict | None = None) -> dict:
        """Award XP to a user for an action.

        Applies streak multiplier, checks for level-up and badge unlocks.

        Returns:
            dict with xp_earned, new_total, level_up (bool), new_level, new_title, badges_earned
        """
        base_xp = XP_ACTIONS.get(action)
        if base_xp is None:
            raise ValueError(f"Unknown XP action: {action}")

        # Get current gamification profile
        result = await db.execute(
            select(UserGamification).where(UserGamification.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise ValueError(f"No gamification profile for user {user_id}")

        old_level = profile.level
        multiplier = profile.streak_multiplier or 1.0
        xp_earned = int(base_xp * multiplier)

        # Record XP history
        xp_entry = XPHistory(
            user_id=user_id,
            action=action,
            xp_base=base_xp,
            multiplier=multiplier,
            xp_earned=xp_earned,
            stream_id=stream_id,
            metadata=metadata or {},
        )
        db.add(xp_entry)

        # Update totals
        new_total = profile.total_xp + xp_earned
        profile.total_xp = new_total
        profile.weekly_xp = (profile.weekly_xp or 0) + xp_earned
        profile.monthly_xp = (profile.monthly_xp or 0) + xp_earned

        # Check level-up
        new_level, new_title, next_threshold = self.get_level_for_xp(new_total)
        level_up = new_level > old_level
        if level_up:
            profile.level = new_level
            profile.level_title = new_title
            logger.info(f"Level up! user={user_id} level={new_level} title={new_title}")

        await db.flush()

        # Check badge unlocks
        badges_earned = await self.check_badges(db, user_id)

        await db.commit()

        return {
            "xp_earned": xp_earned,
            "new_total": new_total,
            "multiplier": multiplier,
            "level_up": level_up,
            "new_level": new_level,
            "new_title": new_title,
            "next_level_xp": next_threshold,
            "badges_earned": badges_earned,
        }

    async def update_streak(self, db: AsyncSession, user_id: str) -> dict:
        """Update a user's daily streak.

        - Same day: no change
        - Yesterday: increment streak
        - Older: reset to 1
        """
        result = await db.execute(
            select(UserGamification).where(UserGamification.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise ValueError(f"No gamification profile for user {user_id}")

        today = date.today()
        last_active = profile.last_active_date
        broken = False

        if last_active == today:
            return {
                "current_streak": profile.current_streak,
                "best_streak": profile.best_streak,
                "multiplier": float(profile.streak_multiplier),
                "broken": False,
            }

        if last_active == today - timedelta(days=1):
            profile.current_streak += 1
        elif last_active is not None:
            broken = profile.current_streak > 1
            profile.current_streak = 1
        else:
            profile.current_streak = 1

        if profile.current_streak > profile.best_streak:
            profile.best_streak = profile.current_streak

        profile.streak_multiplier = self.get_streak_multiplier(profile.current_streak)
        profile.last_active_date = today

        await db.commit()

        logger.info(
            f"Streak updated: user={user_id} streak={profile.current_streak} "
            f"multiplier={profile.streak_multiplier}x broken={broken}"
        )

        return {
            "current_streak": profile.current_streak,
            "best_streak": profile.best_streak,
            "multiplier": float(profile.streak_multiplier),
            "broken": broken,
        }

    async def check_badges(self, db: AsyncSession, user_id: str) -> list[dict]:
        """Check and award any newly qualified badges.

        Returns list of newly earned badge dicts.
        """
        # Get user's current badges
        result = await db.execute(
            select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
        )
        earned_ids = {row[0] for row in result.fetchall()}

        # Get all badges
        result = await db.execute(select(Badge))
        all_badges = result.scalars().all()

        # Get user profile for checking requirements
        result = await db.execute(
            select(UserGamification).where(UserGamification.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return []

        # Get user data
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return []

        newly_earned = []

        requirement_checks = {
            "first_stream": profile.total_streams >= 1,
            "stream_duration_120": profile.total_stream_minutes >= 120,
            "concurrent_viewers_100": False,  # Checked in real-time
            "first_tip_received": profile.total_tips_received >= 1,
            "revenue_100": False,  # Checked against transactions
            "revenue_1000": False,
            "streak_7": profile.current_streak >= 7,
            "streak_30": profile.current_streak >= 30,
            "streak_60": profile.current_streak >= 60,
            "followers_50": user.follower_count >= 50,
            "followers_500": user.follower_count >= 500,
            "chat_messages_1000": False,  # Checked against chat_messages count
            "stream_after_midnight": False,  # Checked in real-time
            "stream_before_7am": False,  # Checked in real-time
            "panel_streams_5": False,  # Checked against stream mode
            "challenges_completed_10": False,
            "reach_level_15": profile.level >= 15,
            "tips_sent_50": profile.total_tips_sent >= 50,
            "tips_sent_total_500": False,
            "concurrent_viewers_500": False,
            "total_streams_100": profile.total_streams >= 100,
            "first_1000_users": False,
        }

        for badge in all_badges:
            if badge.id in earned_ids:
                continue

            req_type = badge.requirement_type
            if req_type in requirement_checks and requirement_checks[req_type]:
                user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
                db.add(user_badge)

                profile.badge_count = (profile.badge_count or 0) + 1

                newly_earned.append({
                    "id": str(badge.id),
                    "slug": badge.slug,
                    "name": badge.name,
                    "icon": badge.icon,
                    "rarity": badge.rarity,
                    "xp_reward": badge.xp_reward,
                })

                logger.info(f"Badge earned: user={user_id} badge={badge.slug}")

        if newly_earned:
            await db.flush()

        return newly_earned

    async def update_challenge_progress(self, db: AsyncSession, user_id: str,
                                         action_type: str, increment: int = 1) -> list[dict]:
        """Increment progress on matching challenges.

        Returns list of completed challenge dicts.
        """
        import datetime
        week_num = datetime.date.today().isocalendar()[1] % 3

        result = await db.execute(
            select(WeeklyChallenge).where(WeeklyChallenge.week_number == week_num)
        )
        challenges = result.scalars().all()

        completed = []

        for challenge in challenges:
            if challenge.action_type != action_type:
                continue

            # Get or create progress
            result = await db.execute(
                select(UserChallengeProgress).where(
                    and_(
                        UserChallengeProgress.user_id == user_id,
                        UserChallengeProgress.challenge_id == challenge.id,
                    )
                )
            )
            progress = result.scalar_one_or_none()

            if not progress:
                progress = UserChallengeProgress(
                    user_id=user_id,
                    challenge_id=challenge.id,
                    current_progress=0,
                )
                db.add(progress)
                await db.flush()

            if progress.completed:
                continue

            progress.current_progress += increment

            if progress.current_progress >= challenge.target:
                progress.completed = True
                progress.completed_at = func.now()

                if not progress.xp_awarded:
                    progress.xp_awarded = True
                    completed.append({
                        "challenge_id": str(challenge.id),
                        "title": challenge.title,
                        "xp_reward": challenge.xp_reward,
                    })

        if completed:
            await db.flush()

        await db.commit()
        return completed

    async def get_leaderboard(self, db: AsyncSession, period: str = "weekly",
                              limit: int = 20) -> list[dict]:
        """Get XP leaderboard.

        Args:
            period: weekly, monthly, or alltime
            limit: Max entries to return
        """
        if period == "weekly":
            order_col = UserGamification.weekly_xp
        elif period == "monthly":
            order_col = UserGamification.monthly_xp
        else:
            order_col = UserGamification.total_xp

        result = await db.execute(
            select(
                UserGamification.user_id,
                order_col.label("xp"),
                UserGamification.level,
                UserGamification.level_title,
                User.username,
                User.display_name,
                User.avatar_url,
            )
            .join(User, User.id == UserGamification.user_id)
            .order_by(order_col.desc())
            .limit(limit)
        )

        entries = []
        for rank, row in enumerate(result.fetchall(), 1):
            entries.append({
                "rank": rank,
                "user_id": str(row.user_id),
                "username": row.username,
                "display_name": row.display_name,
                "avatar_url": row.avatar_url,
                "xp": row.xp or 0,
                "level": row.level,
                "level_title": row.level_title,
            })

        return entries

    async def get_profile(self, db: AsyncSession, user_id: str) -> dict:
        """Get complete gamification profile with badges and progress."""
        result = await db.execute(
            select(UserGamification).where(UserGamification.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return {}

        # Get badges
        result = await db.execute(
            select(Badge, UserBadge.earned_at)
            .join(UserBadge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.user_id == user_id)
            .order_by(UserBadge.earned_at.desc())
        )
        badges = [
            {
                "id": str(badge.id),
                "slug": badge.slug,
                "name": badge.name,
                "icon": badge.icon,
                "category": badge.category,
                "rarity": badge.rarity,
                "earned_at": str(earned_at) if earned_at else None,
            }
            for badge, earned_at in result.fetchall()
        ]

        # Calculate progress
        _, _, next_threshold = self.get_level_for_xp(profile.total_xp)
        current_level_xp = LEVELS[profile.level - 1][2] if profile.level <= len(LEVELS) else 0
        if next_threshold > 0:
            progress_pct = ((profile.total_xp - current_level_xp) / max(next_threshold - current_level_xp, 1)) * 100
        else:
            progress_pct = 100.0

        return {
            "total_xp": profile.total_xp,
            "level": profile.level,
            "level_title": profile.level_title,
            "next_level_xp": next_threshold,
            "progress_pct": round(progress_pct, 1),
            "current_streak": profile.current_streak,
            "best_streak": profile.best_streak,
            "streak_multiplier": float(profile.streak_multiplier),
            "last_active_date": str(profile.last_active_date) if profile.last_active_date else None,
            "total_streams": profile.total_streams,
            "total_stream_minutes": profile.total_stream_minutes,
            "total_tips_sent": profile.total_tips_sent,
            "total_tips_received": profile.total_tips_received,
            "badge_count": profile.badge_count,
            "weekly_xp": profile.weekly_xp,
            "monthly_xp": profile.monthly_xp,
            "badges": badges,
        }


gamification_engine = GamificationEngine()
