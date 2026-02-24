"""Notifications router — REST endpoints for managing in-app notifications.

Real-time delivery is handled by the WebSocket router (api/routers/websocket.py).
This router provides CRUD operations for the notification inbox.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
import uuid
from datetime import datetime, timezone

from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User, Notification
from api.routers.websocket import notification_manager

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Schemas ──────────────────────────────────────────────────────────────────

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    is_read: bool
    created_at: str

    @classmethod
    def from_orm(cls, n: Notification) -> "NotificationOut":
        return cls(
            id=str(n.id),
            user_id=str(n.user_id),
            type=getattr(n, "type", "info"),
            title=getattr(n, "title", "Notification"),
            body=getattr(n, "body", ""),
            is_read=getattr(n, "is_read", False),
            created_at=str(getattr(n, "created_at", datetime.now(timezone.utc))),
        )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/notifications", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's notification inbox."""
    q = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        q = q.where(Notification.is_read == False)  # noqa: E712
    q = q.order_by(Notification.created_at.desc()).limit(limit)
    result = await db.execute(q)
    notifications = result.scalars().all()
    return [NotificationOut.from_orm(n) for n in notifications]


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    await db.commit()


@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all of the current user's notifications as read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa
        .values(is_read=True)
    )
    await db.commit()


@router.delete("/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a single notification."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    await db.delete(notif)
    await db.commit()


# ── Internal helper (called by other routers) ─────────────────────────────────

async def push_notification(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str,
    notif_type: str = "info",
) -> None:
    """
    Persist a notification to the DB and push it live via WebSocket.
    Other routers (payments, ai, streams) should import and call this.
    """
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notif)
    await db.commit()

    # Push live via WebSocket if user is connected
    try:
        await notification_manager.send_to_user(user_id, {
            "type": "notification",
            "title": title,
            "body": body,
            "notif_type": notif_type,
            "id": notif.id,
        })
    except Exception:
        logger.debug("User %s not connected via WS; notification persisted only.", user_id)
