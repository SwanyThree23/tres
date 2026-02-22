"""
SwanyThree Platform — SQLAlchemy 2.0 ORM models.

All 30 tables are defined here using ``Mapped[]`` annotations and
``mapped_column()``.  UUID primary keys default to ``uuid_generate_v4()``
on the server side (requires the ``uuid-ossp`` PostgreSQL extension).
"""

from __future__ import annotations

import enum
from datetime import date, datetime
from typing import Any, List, Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.database import Base

# ---------------------------------------------------------------------------
# Enum types
# ---------------------------------------------------------------------------


class UserRole(str, enum.Enum):
    viewer = "viewer"
    creator = "creator"
    moderator = "moderator"
    admin = "admin"


class StreamStatus(str, enum.Enum):
    scheduled = "scheduled"
    live = "live"
    ended = "ended"
    cancelled = "cancelled"


class GuestRole(str, enum.Enum):
    co_host = "co-host"
    guest = "guest"
    viewer = "viewer"


class DestinationPlatform(str, enum.Enum):
    youtube = "youtube"
    twitch = "twitch"
    facebook = "facebook"
    custom_rtmp = "custom_rtmp"


class RecordingStatus(str, enum.Enum):
    recording = "recording"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class TransactionType(str, enum.Enum):
    subscription = "subscription"
    donation = "donation"
    tip = "tip"
    payout = "payout"
    refund = "refund"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class PayoutStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class SubscriptionTier(str, enum.Enum):
    free = "free"
    pro = "pro"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    past_due = "past_due"
    cancelled = "cancelled"
    trialing = "trialing"


class XPAction(str, enum.Enum):
    stream_start = "stream_start"
    stream_minute = "stream_minute"
    chat_message = "chat_message"
    follow = "follow"
    donate = "donate"
    badge_earned = "badge_earned"
    challenge_complete = "challenge_complete"
    daily_login = "daily_login"
    post_create = "post_create"
    post_like = "post_like"


class BadgeTier(str, enum.Enum):
    bronze = "bronze"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"
    diamond = "diamond"


class ChallengeStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    expired = "expired"


class NotificationType(str, enum.Enum):
    follow = "follow"
    stream_live = "stream_live"
    donation = "donation"
    badge = "badge"
    system = "system"
    chat_mention = "chat_mention"
    challenge = "challenge"


class AITaskStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class AITaskType(str, enum.Enum):
    transcription = "transcription"
    summary = "summary"
    highlight = "highlight"
    moderation = "moderation"
    chat_response = "chat_response"


class VaultItemType(str, enum.Enum):
    api_key = "api_key"
    oauth_token = "oauth_token"
    webhook_secret = "webhook_secret"
    custom = "custom"


# ---------------------------------------------------------------------------
# Helper column shortcuts
# ---------------------------------------------------------------------------

def _uuid_pk() -> Mapped[UUID]:
    return mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )


def _created_at() -> Mapped[datetime]:
    return mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )


def _updated_at() -> Mapped[datetime]:
    return mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=text("now()"),
        nullable=False,
    )


# ═══════════════════════════════════════════════════════════════════════════
# 1. User
# ═══════════════════════════════════════════════════════════════════════════


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = _uuid_pk()
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_constraint=True),
        server_default=text("'viewer'"),
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"), nullable=False)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_connect_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stream_key: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    # relationships
    sessions: Mapped[List["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    oauth_accounts: Mapped[List["UserOAuth"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    user_settings: Mapped[Optional["UserSettings"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    streams: Mapped[List["Stream"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    payouts: Mapped[List["Payout"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    subscription: Mapped[Optional["Subscription"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    gamification: Mapped[Optional["UserGamification"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    xp_history: Mapped[List["XPHistory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    user_badges: Mapped[List["UserBadge"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    challenge_progress: Mapped[List["UserChallengeProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_messages: Mapped[List["ChatMessage"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    posts: Mapped[List["Post"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    post_likes: Mapped[List["PostLike"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    post_comments: Mapped[List["PostComment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    ai_tasks: Mapped[List["AITask"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    vault_items: Mapped[List["VaultItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    nfts: Mapped[List["NFT"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_username", "username"),
        Index("ix_users_stream_key", "stream_key"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 2. UserSession
# ═══════════════════════════════════════════════════════════════════════════


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = _created_at()

    user: Mapped["User"] = relationship(back_populates="sessions")

    __table_args__ = (
        Index("ix_user_sessions_user_id", "user_id"),
        Index("ix_user_sessions_refresh_token", "refresh_token"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 3. UserOAuth
# ═══════════════════════════════════════════════════════════════════════════


class UserOAuth(Base):
    __tablename__ = "user_oauth"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = _created_at()

    user: Mapped["User"] = relationship(back_populates="oauth_accounts")

    __table_args__ = (
        Index("ix_user_oauth_provider_uid", "provider", "provider_user_id", unique=True),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 4. UserSettings
# ═══════════════════════════════════════════════════════════════════════════


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    theme: Mapped[str] = mapped_column(String(20), server_default=text("'dark'"), nullable=False)
    language: Mapped[str] = mapped_column(String(10), server_default=text("'en'"), nullable=False)
    email_notifications: Mapped[bool] = mapped_column(Boolean, server_default=text("true"), nullable=False)
    push_notifications: Mapped[bool] = mapped_column(Boolean, server_default=text("true"), nullable=False)
    auto_record: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    default_stream_quality: Mapped[str] = mapped_column(String(20), server_default=text("'720p'"), nullable=False)
    ai_features_enabled: Mapped[bool] = mapped_column(Boolean, server_default=text("true"), nullable=False)
    custom_preferences: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="user_settings")


# ═══════════════════════════════════════════════════════════════════════════
# 5. Stream
# ═══════════════════════════════════════════════════════════════════════════


class Stream(Base):
    __tablename__ = "streams"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[StreamStatus] = mapped_column(
        Enum(StreamStatus, name="stream_status", create_constraint=True),
        server_default=text("'scheduled'"),
        nullable=False,
    )
    is_private: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    viewer_count: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    peak_viewers: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tags: Mapped[Optional[list[Any]]] = mapped_column(JSONB, nullable=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    mediasoup_room_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="streams")
    guests: Mapped[List["StreamGuest"]] = relationship(back_populates="stream", cascade="all, delete-orphan")
    destinations: Mapped[List["StreamDestination"]] = relationship(back_populates="stream", cascade="all, delete-orphan")
    recordings: Mapped[List["Recording"]] = relationship(back_populates="stream", cascade="all, delete-orphan")
    chat_messages: Mapped[List["ChatMessage"]] = relationship(back_populates="stream", cascade="all, delete-orphan")
    transcripts: Mapped[List["StreamTranscript"]] = relationship(back_populates="stream", cascade="all, delete-orphan")
    analytics: Mapped[Optional["StreamAnalytics"]] = relationship(back_populates="stream", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_streams_user_id", "user_id"),
        Index("ix_streams_status", "status"),
        Index("ix_streams_scheduled_at", "scheduled_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 6. StreamGuest
# ═══════════════════════════════════════════════════════════════════════════


class StreamGuest(Base):
    __tablename__ = "stream_guests"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[GuestRole] = mapped_column(
        Enum(GuestRole, name="guest_role", create_constraint=True),
        server_default=text("'guest'"),
        nullable=False,
    )
    joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    left_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = _created_at()

    stream: Mapped["Stream"] = relationship(back_populates="guests")
    user: Mapped["User"] = relationship()

    __table_args__ = (
        Index("ix_stream_guests_stream_id", "stream_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 7. StreamDestination
# ═══════════════════════════════════════════════════════════════════════════


class StreamDestination(Base):
    __tablename__ = "stream_destinations"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[DestinationPlatform] = mapped_column(
        Enum(DestinationPlatform, name="destination_platform", create_constraint=True),
        nullable=False,
    )
    rtmp_url: Mapped[str] = mapped_column(Text, nullable=False)
    stream_key_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"), nullable=False)
    created_at: Mapped[datetime] = _created_at()

    stream: Mapped["Stream"] = relationship(back_populates="destinations")

    __table_args__ = (
        Index("ix_stream_destinations_stream_id", "stream_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 8. Recording
# ═══════════════════════════════════════════════════════════════════════════


class Recording(Base):
    __tablename__ = "recordings"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    format: Mapped[str] = mapped_column(String(20), server_default=text("'mp4'"), nullable=False)
    status: Mapped[RecordingStatus] = mapped_column(
        Enum(RecordingStatus, name="recording_status", create_constraint=True),
        server_default=text("'recording'"),
        nullable=False,
    )
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    stream: Mapped["Stream"] = relationship(back_populates="recordings")

    __table_args__ = (
        Index("ix_recordings_stream_id", "stream_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 9. Transaction
# ═══════════════════════════════════════════════════════════════════════════


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type", create_constraint=True),
        nullable=False,
    )
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus, name="transaction_status", create_constraint=True),
        server_default=text("'pending'"),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), server_default=text("'USD'"), nullable=False)
    platform_fee: Mapped[float] = mapped_column(Float, server_default=text("0.0"), nullable=False)
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="transactions", foreign_keys=[user_id])
    recipient: Mapped[Optional["User"]] = relationship(foreign_keys=[recipient_id])

    __table_args__ = (
        Index("ix_transactions_user_id", "user_id"),
        Index("ix_transactions_recipient_id", "recipient_id"),
        Index("ix_transactions_stripe_pi", "stripe_payment_intent_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 10. Payout
# ═══════════════════════════════════════════════════════════════════════════


class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), server_default=text("'USD'"), nullable=False)
    status: Mapped[PayoutStatus] = mapped_column(
        Enum(PayoutStatus, name="payout_status", create_constraint=True),
        server_default=text("'pending'"),
        nullable=False,
    )
    stripe_payout_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    initiated_at: Mapped[datetime] = _created_at()
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="payouts")

    __table_args__ = (
        Index("ix_payouts_user_id", "user_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 11. Subscription
# ═══════════════════════════════════════════════════════════════════════════


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    tier: Mapped[SubscriptionTier] = mapped_column(
        Enum(SubscriptionTier, name="subscription_tier", create_constraint=True),
        server_default=text("'free'"),
        nullable=False,
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status", create_constraint=True),
        server_default=text("'active'"),
        nullable=False,
    )
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="subscription")


# ═══════════════════════════════════════════════════════════════════════════
# 12. UserGamification
# ═══════════════════════════════════════════════════════════════════════════


class UserGamification(Base):
    __tablename__ = "user_gamification"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    xp_total: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    level: Mapped[int] = mapped_column(Integer, server_default=text("1"), nullable=False)
    current_streak_days: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    longest_streak_days: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    last_active_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    streams_count: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    total_stream_minutes: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="gamification")


# ═══════════════════════════════════════════════════════════════════════════
# 13. XPHistory
# ═══════════════════════════════════════════════════════════════════════════


class XPHistory(Base):
    __tablename__ = "xp_history"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    action: Mapped[XPAction] = mapped_column(
        Enum(XPAction, name="xp_action", create_constraint=True),
        nullable=False,
    )
    xp_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    multiplier: Mapped[float] = mapped_column(Float, server_default=text("1.0"), nullable=False)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = _created_at()

    user: Mapped["User"] = relationship(back_populates="xp_history")

    __table_args__ = (
        Index("ix_xp_history_user_id", "user_id"),
        Index("ix_xp_history_created_at", "created_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 14. Badge
# ═══════════════════════════════════════════════════════════════════════════


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tier: Mapped[BadgeTier] = mapped_column(
        Enum(BadgeTier, name="badge_tier", create_constraint=True),
        server_default=text("'bronze'"),
        nullable=False,
    )
    xp_reward: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    criteria: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = _created_at()

    user_badges: Mapped[List["UserBadge"]] = relationship(back_populates="badge", cascade="all, delete-orphan")


# ═══════════════════════════════════════════════════════════════════════════
# 15. UserBadge
# ═══════════════════════════════════════════════════════════════════════════


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    badge_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("badges.id", ondelete="CASCADE"),
        nullable=False,
    )
    earned_at: Mapped[datetime] = _created_at()

    user: Mapped["User"] = relationship(back_populates="user_badges")
    badge: Mapped["Badge"] = relationship(back_populates="user_badges")

    __table_args__ = (
        Index("ix_user_badges_user_badge", "user_id", "badge_id", unique=True),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 16. WeeklyChallenge
# ═══════════════════════════════════════════════════════════════════════════


class WeeklyChallenge(Base):
    __tablename__ = "weekly_challenges"

    id: Mapped[UUID] = _uuid_pk()
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False)
    criteria: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    goal_value: Mapped[int] = mapped_column(Integer, server_default=text("1"), nullable=False)
    status: Mapped[ChallengeStatus] = mapped_column(
        Enum(ChallengeStatus, name="challenge_status", create_constraint=True),
        server_default=text("'active'"),
        nullable=False,
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = _created_at()

    participants: Mapped[List["UserChallengeProgress"]] = relationship(back_populates="challenge", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_weekly_challenges_status", "status"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 17. UserChallengeProgress
# ═══════════════════════════════════════════════════════════════════════════


class UserChallengeProgress(Base):
    __tablename__ = "user_challenge_progress"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    challenge_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("weekly_challenges.id", ondelete="CASCADE"),
        nullable=False,
    )
    current_value: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="challenge_progress")
    challenge: Mapped["WeeklyChallenge"] = relationship(back_populates="participants")

    __table_args__ = (
        Index("ix_user_challenge_progress_uc", "user_id", "challenge_id", unique=True),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 18. ChatMessage
# ═══════════════════════════════════════════════════════════════════════════


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = _created_at()

    stream: Mapped["Stream"] = relationship(back_populates="chat_messages")
    user: Mapped["User"] = relationship(back_populates="chat_messages")

    __table_args__ = (
        Index("ix_chat_messages_stream_id", "stream_id"),
        Index("ix_chat_messages_created_at", "created_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 19. ChatBan
# ═══════════════════════════════════════════════════════════════════════════


class ChatBan(Base):
    __tablename__ = "chat_bans"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    banned_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_permanent: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    created_at: Mapped[datetime] = _created_at()

    stream: Mapped["Stream"] = relationship()
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    moderator: Mapped["User"] = relationship(foreign_keys=[banned_by])

    __table_args__ = (
        Index("ix_chat_bans_stream_user", "stream_id", "user_id", unique=True),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 20. Follower
# ═══════════════════════════════════════════════════════════════════════════


class Follower(Base):
    __tablename__ = "followers"

    id: Mapped[UUID] = _uuid_pk()
    follower_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    following_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = _created_at()

    follower: Mapped["User"] = relationship(foreign_keys=[follower_id])
    following: Mapped["User"] = relationship(foreign_keys=[following_id])

    __table_args__ = (
        Index("ix_followers_pair", "follower_id", "following_id", unique=True),
        Index("ix_followers_following_id", "following_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 21. Notification
# ═══════════════════════════════════════════════════════════════════════════


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type", create_constraint=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    action_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = _created_at()

    user: Mapped["User"] = relationship(back_populates="notifications")

    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_is_read", "user_id", "is_read"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 22. Post
# ═══════════════════════════════════════════════════════════════════════════


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    media_urls: Mapped[Optional[list[Any]]] = mapped_column(JSONB, nullable=True)
    like_count: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="posts")
    likes: Mapped[List["PostLike"]] = relationship(back_populates="post", cascade="all, delete-orphan")
    comments: Mapped[List["PostComment"]] = relationship(back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_posts_user_id", "user_id"),
        Index("ix_posts_created_at", "created_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 23. PostLike
# ═══════════════════════════════════════════════════════════════════════════


class PostLike(Base):
    __tablename__ = "post_likes"

    id: Mapped[UUID] = _uuid_pk()
    post_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = _created_at()

    post: Mapped["Post"] = relationship(back_populates="likes")
    user: Mapped["User"] = relationship(back_populates="post_likes")

    __table_args__ = (
        Index("ix_post_likes_post_user", "post_id", "user_id", unique=True),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 24. PostComment
# ═══════════════════════════════════════════════════════════════════════════


class PostComment(Base):
    __tablename__ = "post_comments"

    id: Mapped[UUID] = _uuid_pk()
    post_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("post_comments.id", ondelete="CASCADE"),
        nullable=True,
    )
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    post: Mapped["Post"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="post_comments")
    parent: Mapped[Optional["PostComment"]] = relationship(remote_side="PostComment.id", backref="replies")

    __table_args__ = (
        Index("ix_post_comments_post_id", "post_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 25. AITask
# ═══════════════════════════════════════════════════════════════════════════


class AITask(Base):
    __tablename__ = "ai_tasks"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    stream_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="SET NULL"),
        nullable=True,
    )
    type: Mapped[AITaskType] = mapped_column(
        Enum(AITaskType, name="ai_task_type", create_constraint=True),
        nullable=False,
    )
    status: Mapped[AITaskStatus] = mapped_column(
        Enum(AITaskStatus, name="ai_task_status", create_constraint=True),
        server_default=text("'queued'"),
        nullable=False,
    )
    input_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    model_used: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = _created_at()
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="ai_tasks")
    stream: Mapped[Optional["Stream"]] = relationship()

    __table_args__ = (
        Index("ix_ai_tasks_user_id", "user_id"),
        Index("ix_ai_tasks_status", "status"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 26. StreamTranscript
# ═══════════════════════════════════════════════════════════════════════════


class StreamTranscript(Base):
    __tablename__ = "stream_transcripts"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
    )
    segment_index: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    speaker_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = _created_at()

    stream: Mapped["Stream"] = relationship(back_populates="transcripts")

    __table_args__ = (
        Index("ix_stream_transcripts_stream_id", "stream_id"),
        Index("ix_stream_transcripts_segment", "stream_id", "segment_index"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 27. StreamAnalytics
# ═══════════════════════════════════════════════════════════════════════════


class StreamAnalytics(Base):
    __tablename__ = "stream_analytics"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    total_viewers: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    peak_concurrent: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    avg_watch_time_seconds: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    chat_message_count: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    new_followers: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    revenue: Mapped[float] = mapped_column(Float, server_default=text("0.0"), nullable=False)
    viewer_timeline: Mapped[Optional[list[Any]]] = mapped_column(JSONB, nullable=True)
    geo_distribution: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    device_breakdown: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    stream: Mapped["Stream"] = relationship(back_populates="analytics")


# ═══════════════════════════════════════════════════════════════════════════
# 28. PlatformMetrics
# ═══════════════════════════════════════════════════════════════════════════


class PlatformMetrics(Base):
    __tablename__ = "platform_metrics"

    id: Mapped[UUID] = _uuid_pk()
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    active_users: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    total_streams: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    total_stream_minutes: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    total_revenue: Mapped[float] = mapped_column(Float, server_default=text("0.0"), nullable=False)
    new_signups: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    ai_tasks_processed: Mapped[int] = mapped_column(Integer, server_default=text("0"), nullable=False)
    extra_metrics: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = _created_at()

    __table_args__ = (
        Index("ix_platform_metrics_date", "date"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 29. VaultItem
# ═══════════════════════════════════════════════════════════════════════════


class VaultItem(Base):
    __tablename__ = "vault_items"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[VaultItemType] = mapped_column(
        Enum(VaultItemType, name="vault_item_type", create_constraint=True),
        nullable=False,
    )
    encrypted_value: Mapped[str] = mapped_column(Text, nullable=False)
    iv: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_rotated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    user: Mapped["User"] = relationship(back_populates="vault_items")

    __table_args__ = (
        Index("ix_vault_items_user_id", "user_id"),
        Index("ix_vault_items_user_name", "user_id", "name", unique=True),
    )


# ═══════════════════════════════════════════════════════════════════════════
# 30. EmbedConfig
# ═══════════════════════════════════════════════════════════════════════════


class EmbedConfig(Base):
    __tablename__ = "embed_configs"

    id: Mapped[UUID] = _uuid_pk()
    stream_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
    )
    allowed_domains: Mapped[Optional[list[Any]]] = mapped_column(JSONB, nullable=True)
    theme: Mapped[str] = mapped_column(String(20), server_default=text("'dark'"), nullable=False)
    chat_enabled: Mapped[bool] = mapped_column(Boolean, server_default=text("true"), nullable=False)
    autoplay: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    max_width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    custom_css: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    branding_hidden: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    stream: Mapped["Stream"] = relationship()

    __table_args__ = (
        Index("ix_embed_configs_stream_id", "stream_id"),
    )


# ---------------------------------------------------------------------------
# Collect all model classes for convenient star-import.
# ---------------------------------------------------------------------------

__all__ = [
    "User",
    "UserSession",
    "UserOAuth",
    "UserSettings",
    "Stream",
    "StreamGuest",
    "StreamDestination",
    "Recording",
    "Transaction",
    "Payout",
    "Subscription",
    "UserGamification",
    "XPHistory",
    "Badge",
    "UserBadge",
    "WeeklyChallenge",
    "UserChallengeProgress",
    "ChatMessage",
    "ChatBan",
    "Follower",
    "Notification",
    "Post",
    "PostLike",
    "PostComment",
    "AITask",
    "StreamTranscript",
    "StreamAnalytics",
    "PlatformMetrics",
    "VaultItem",
    "EmbedConfig",
    # Enums
    "UserRole",
    "StreamStatus",
    "GuestRole",
    "DestinationPlatform",
    "RecordingStatus",
    "TransactionType",
    "TransactionStatus",
    "PayoutStatus",
    "SubscriptionTier",
    "SubscriptionStatus",
    "XPAction",
    "BadgeTier",
    "ChallengeStatus",
    "NotificationType",
    "AITaskStatus",
    "AITaskType",
    "VaultItemType",
]

class NFT(Base):
    """
    Track minted stream highlights as NFTs.
    """
    __tablename__ = "nfts"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    stream_id: Mapped[UUID] = mapped_column(ForeignKey("streams.id"), nullable=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    video_url: Mapped[str] = mapped_column(Text, nullable=False)
    
    mint_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    token_id: Mapped[str] = mapped_column(String(100), nullable=True)
    contract_address: Mapped[str] = mapped_column(String(255), nullable=True)
    blockchain: Mapped[str] = mapped_column(String(50), default="polygon")
    
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="nfts")
    stream: Mapped["Stream"] = relationship("Stream")
