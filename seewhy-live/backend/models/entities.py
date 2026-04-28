import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime,
    ForeignKey, Enum as SAEnum, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(
        SAEnum("viewer", "creator", "admin", name="user_role"), default="viewer"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    stream_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    streams: Mapped[list["Stream"]] = relationship("Stream", back_populates="creator")
    questions: Mapped[list["WhyQuestion"]] = relationship("WhyQuestion", back_populates="author")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="author")


class Stream(Base):
    __tablename__ = "streams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tags: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    status: Mapped[str] = mapped_column(
        SAEnum("scheduled", "live", "ended", name="stream_status"), default="scheduled"
    )
    stream_key: Mapped[str] = mapped_column(String(64), unique=True, default=lambda: f"sk_{new_uuid()}")
    hls_url: Mapped[str | None] = mapped_column(String(500))
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    viewer_count: Mapped[int] = mapped_column(Integer, default=0)
    peak_viewer_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    creator: Mapped["User"] = relationship("User", back_populates="streams")
    questions: Mapped[list["WhyQuestion"]] = relationship("WhyQuestion", back_populates="stream")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="stream")

    @property
    def is_live(self) -> bool:
        return self.status == "live"

    @property
    def tags_list(self) -> list[str]:
        return [t.strip() for t in self.tags.split(",") if t.strip()] if self.tags else []


class WhyQuestion(Base):
    __tablename__ = "why_questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    stream_id: Mapped[str] = mapped_column(String(36), ForeignKey("streams.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    ai_answer: Mapped[str | None] = mapped_column(Text)
    is_answered: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    stream: Mapped["Stream"] = relationship("Stream", back_populates="questions")
    author: Mapped["User"] = relationship("User", back_populates="questions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    stream_id: Mapped[str] = mapped_column(String(36), ForeignKey("streams.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_why_question: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    stream: Mapped["Stream"] = relationship("Stream", back_populates="chat_messages")
    author: Mapped["User"] = relationship("User", back_populates="chat_messages")


class Follow(Base):
    __tablename__ = "follows"

    follower_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    following_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    stream_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("streams.id"))
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    recipient_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    creator_amount: Mapped[float] = mapped_column(Float, nullable=False)  # 90%
    platform_amount: Mapped[float] = mapped_column(Float, nullable=False)  # 10%
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # tip, subscription
    stripe_payment_intent: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
