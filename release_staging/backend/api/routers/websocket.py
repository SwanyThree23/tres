"""WebSocket endpoint — real-time notifications and event streaming."""

import json
import logging
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError

from api.config import settings
from api.middleware.auth import decode_token

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Connection Registry ────────────────────────────────────────────────────────
# user_id -> set of active WebSocket connections (supports multiple tabs)
_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        if user_id not in _connections:
            _connections[user_id] = set()
        _connections[user_id].add(ws)
        logger.info("WS connected: user=%s  total_users=%d", user_id, len(_connections))

    def disconnect(self, user_id: str, ws: WebSocket) -> None:
        bucket = _connections.get(user_id, set())
        bucket.discard(ws)
        if not bucket:
            _connections.pop(user_id, None)
        logger.info("WS disconnected: user=%s  remaining_users=%d", user_id, len(_connections))

    async def send_to_user(self, user_id: str, payload: dict) -> None:
        """Send a JSON payload to all connections for a user."""
        stale: list[WebSocket] = []
        for ws in list(_connections.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(user_id, ws)

    async def broadcast(self, payload: dict, exclude_user: str | None = None) -> None:
        """Broadcast to all connected users."""
        for uid, sockets in list(_connections.items()):
            if uid == exclude_user:
                continue
            for ws in list(sockets):
                try:
                    await ws.send_text(json.dumps(payload))
                except Exception:
                    self.disconnect(uid, ws)


manager = ConnectionManager()


# ── WebSocket Route ────────────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_endpoint(
    ws: WebSocket,
    token: str = Query(default=""),
):
    """
    WebSocket connection handler.

    Clients connect with: ws://host/api/ws?token=<access_token>

    Messages from the server are JSON objects with at minimum:
      { "type": string, "title"?: string, "body"?: string, ... }

    The client may send heartbeat pings:
      { "type": "ping" }  → server replies { "type": "pong" }
    """
    # Resolve user identity from token
    user_id = "anonymous"
    if token and token != "demo-user-id":
        try:
            payload = decode_token(token)
            user_id = payload.get("sub", "anonymous")
        except Exception:
            user_id = "anonymous"

    await manager.connect(user_id, ws)

    # Send welcome frame
    await ws.send_text(json.dumps({
        "type": "connected",
        "title": "Connected",
        "body": "Real-time events active.",
        "user_id": user_id,
    }))

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
                if msg.get("type") == "ping":
                    await ws.send_text(json.dumps({"type": "pong"}))
                else:
                    logger.debug("WS msg from %s: %s", user_id, msg)
            except json.JSONDecodeError:
                await ws.send_text(json.dumps({"type": "error", "body": "Invalid JSON."}))
    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)


# Expose manager so other routers can push notifications
notification_manager = manager
