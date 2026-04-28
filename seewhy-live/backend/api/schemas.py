from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").isalnum():
            raise ValueError("Username must contain only letters, numbers, and underscores")
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be 3–50 characters")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ── Users ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    display_name: str
    bio: str | None
    avatar_url: str | None
    role: str
    is_verified: bool
    follower_count: int
    following_count: int
    stream_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None


# ── Streams ───────────────────────────────────────────────────────────────────

class StreamCreate(BaseModel):
    title: str
    description: str | None = None
    category: str
    tags: list[str] = []

    @field_validator("title")
    @classmethod
    def title_length(cls, v: str) -> str:
        if len(v.strip()) < 5:
            raise ValueError("Title must be at least 5 characters")
        return v.strip()


class StreamOut(BaseModel):
    id: str
    title: str
    description: str | None
    category: str
    tags: list[str]
    creator_id: str
    creator_username: str
    creator_display_name: str
    creator_avatar_url: str | None
    is_live: bool
    viewer_count: int
    peak_viewer_count: int
    hls_url: str | None
    thumbnail_url: str | None
    started_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Why Questions ─────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def question_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Question must be at least 5 characters")
        if len(v) > 300:
            raise ValueError("Question must be at most 300 characters")
        return v


class QuestionOut(BaseModel):
    id: str
    stream_id: str
    user_id: str
    username: str
    display_name: str
    question: str
    upvotes: int
    ai_answer: str | None
    is_answered: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessageOut(BaseModel):
    id: str
    stream_id: str
    user_id: str
    username: str
    display_name: str
    avatar_url: str | None
    content: str
    is_why_question: bool
    timestamp: datetime

    class Config:
        from_attributes = True
