"""SwanyThree Notification Service — In-app notifications and email dispatch."""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from models.entities import Notification

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=2)


class NotificationService:
    """Handles in-app notifications and email delivery."""

    async def create_notification(self, db: AsyncSession, user_id: str, type: str,
                                   title: str, body: str, data: dict | None = None) -> dict:
        """Create an in-app notification.

        Args:
            db: Database session
            user_id: Recipient user ID
            type: Notification type (follow|tip|badge|level_up|challenge|stream_live|system)
            title: Notification title
            body: Notification body text
            data: Optional JSON metadata

        Returns:
            Notification dict
        """
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            data=data or {},
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        logger.info(f"Notification created: user={user_id} type={type} title={title}")

        return {
            "id": str(notification.id),
            "type": notification.type,
            "title": notification.title,
            "body": notification.body,
            "data": notification.data,
            "is_read": notification.is_read,
            "created_at": str(notification.created_at),
        }

    async def mark_read(self, db: AsyncSession, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read.

        Returns True if notification was found and updated.
        """
        result = await db.execute(
            update(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user_id)
            .values(is_read=True, read_at=func.now())
        )
        await db.commit()
        return result.rowcount > 0

    async def mark_all_read(self, db: AsyncSession, user_id: str) -> int:
        """Mark all notifications as read for a user.

        Returns count of updated notifications.
        """
        result = await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True, read_at=func.now())
        )
        await db.commit()
        return result.rowcount

    async def get_unread_count(self, db: AsyncSession, user_id: str) -> int:
        """Get count of unread notifications."""
        result = await db.execute(
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )
        return result.scalar() or 0

    async def get_notifications(self, db: AsyncSession, user_id: str,
                                 limit: int = 50, offset: int = 0,
                                 unread_only: bool = False) -> list[dict]:
        """Get notifications for a user."""
        query = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if unread_only:
            query = query.where(Notification.is_read == False)

        result = await db.execute(query)
        notifications = result.scalars().all()

        return [
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "data": n.data,
                "is_read": n.is_read,
                "read_at": str(n.read_at) if n.read_at else None,
                "created_at": str(n.created_at),
            }
            for n in notifications
        ]

    def _send_email_sync(self, to_email: str, subject: str, body: str) -> bool:
        """Send email synchronously (runs in thread pool)."""
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.warning("SMTP not configured, skipping email")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"SwanyThree <{settings.SMTP_USER}>"
            msg["To"] = to_email
            msg.attach(MIMEText(body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(f"Email sent: to={to_email} subject={subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    async def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email asynchronously via thread pool."""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, self._send_email_sync, to_email, subject, body)


notification_service = NotificationService()
