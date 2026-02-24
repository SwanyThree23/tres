"""Notification service — Redis pub/sub bridge with graceful no-Redis fallback.

When Redis is unavailable (dev/demo mode), notifications are delivered
directly through the WebSocket connection manager without persistence.
"""
import json
import asyncio
import logging
from typing import Dict, List, Optional

from fastapi import WebSocket

from api.config import settings

logger = logging.getLogger(__name__)


# ── Connection Manager ────────────────────────────────────────────────────────

class ConnectionManager:
    """Manages active WebSocket connections per user (multi-tab safe)."""

    def __init__(self) -> None:
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.debug("WS connected: user=%s", user_id)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        bucket = self.active_connections.get(user_id, [])
        if websocket in bucket:
            bucket.remove(websocket)
        if not bucket:
            self.active_connections.pop(user_id, None)
        logger.debug("WS disconnected: user=%s", user_id)

    async def send_personal_message(self, message: dict, user_id: str) -> None:
        stale: list[WebSocket] = []
        for ws in list(self.active_connections.get(user_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(user_id, ws)

    async def broadcast(self, message: dict, exclude: Optional[str] = None) -> None:
        for uid, sockets in list(self.active_connections.items()):
            if uid == exclude:
                continue
            for ws in list(sockets):
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(uid, ws)


manager = ConnectionManager()


# ── Notification Service ──────────────────────────────────────────────────────

class NotificationService:
    """Deliver notifications via Redis pub/sub when available, otherwise directly."""

    def __init__(self) -> None:
        self._redis: Optional[object] = None
        self._redis_available = False

    async def _get_redis(self) -> Optional[object]:
        """Lazily connect to Redis; return None if unavailable."""
        if self._redis is not None:
            return self._redis
        try:
            redis_url = getattr(settings, "REDIS_URL", None)
            if not redis_url:
                return None
            from redis.asyncio import Redis
            r = Redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
            await r.ping()
            self._redis = r
            self._redis_available = True
            logger.info("Redis connected for notifications.")
        except Exception as exc:
            logger.warning("Redis unavailable (%s); falling back to direct WS delivery.", exc)
            self._redis_available = False
            self._redis = None
        return self._redis

    async def broadcast_notification(self, user_id: str, notification_data: dict) -> None:
        """Publish a notification to a user via Redis pub/sub (or directly)."""
        redis = await self._get_redis()
        if redis is not None:
            channel = f"notifications:{user_id}"
            await redis.publish(channel, json.dumps(notification_data))
        else:
            # Direct delivery — no Redis needed
            await manager.send_personal_message(notification_data, user_id)

    async def subscribe_and_push(self, user_id: str) -> None:
        """Worker: bridge Redis pub/sub messages → WebSocket for a connected user."""
        redis = await self._get_redis()
        if redis is None:
            # Nothing to subscribe to in no-Redis mode
            return
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"notifications:{user_id}")
        try:
            async for message in pubsub.listen():
                if message.get("type") == "message":
                    data = json.loads(message["data"])
                    await manager.send_personal_message(data, user_id)
        except asyncio.CancelledError:
            pass
        finally:
            try:
                await pubsub.unsubscribe()
                await pubsub.aclose()
            except Exception:
                pass


notification_service = NotificationService()
