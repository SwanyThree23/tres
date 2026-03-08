"""SwanyThree Chat Routes — Message history and health."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.middleware.auth import get_current_user, optional_user
from models.entities import User, ChatMessage, Stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


class SendMessageRequest(BaseModel):
    stream_id: str
    content: str = Field(..., min_length=1, max_length=500)
    platform: str = "native"


@router.post("/messages")
async def send_message(
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a chat message."""
    result = await db.execute(select(Stream).where(Stream.id == req.stream_id))
    stream = result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    message = ChatMessage(
        stream_id=req.stream_id,
        user_id=current_user.id,
        username=current_user.username,
        content=req.content,
        platform=req.platform,
    )
    db.add(message)

    stream.chat_messages = (stream.chat_messages or 0) + 1
    await db.commit()
    await db.refresh(message)

    return {
        "success": True,
        "message": {
            "id": str(message.id),
            "stream_id": str(message.stream_id),
            "user_id": str(message.user_id),
            "username": message.username,
            "content": message.content,
            "platform": message.platform,
            "type": message.type,
            "created_at": str(message.created_at),
        },
    }


@router.get("/messages/{stream_id}")
async def get_chat_history(
    stream_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get chat message history for a stream."""
    offset = (page - 1) * page_size

    total_result = await db.execute(
        select(func.count(ChatMessage.id)).where(ChatMessage.stream_id == stream_id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.stream_id == stream_id, ChatMessage.is_deleted == False)
        .order_by(ChatMessage.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    messages = result.scalars().all()

    return {
        "success": True,
        "messages": [
            {
                "id": str(m.id),
                "user_id": str(m.user_id) if m.user_id else None,
                "username": m.username,
                "content": m.content,
                "platform": m.platform,
                "type": m.type,
                "is_pinned": m.is_pinned,
                "moderation_status": m.moderation_status,
                "created_at": str(m.created_at),
            }
            for m in messages
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/health")
async def chat_health():
    """Chat system health check."""
    return {"success": True, "status": "healthy"}
