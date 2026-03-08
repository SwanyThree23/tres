"""SwanyThree WebSocket Server — Real-time events via Socket.IO.

Handles: chat, panel management, watch party sync, WebRTC signaling,
gamification events, payment notifications, and viewer counts.
"""

import logging
import time
from typing import Optional

import socketio
import redis.asyncio as aioredis
from jose import jwt, JWTError

from api.config import settings

logger = logging.getLogger(__name__)

# Create Socket.IO server with CORS
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.parsed_cors_origins if settings.CORS_ORIGINS else "*",
    logger=False,
    engineio_logger=False,
)

# Redis for state
_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def authenticate_socket(token: str) -> Optional[dict]:
    """Validate JWT token from socket connection."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            return None
        return {"user_id": payload["sub"], "role": payload.get("role", "viewer")}
    except JWTError:
        return None


# ── Connection Events ────────────────────────────────────────────────

@sio.event
async def connect(sid, environ, auth):
    """Handle client connection with optional JWT auth."""
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")

    user_data = None
    if token:
        user_data = await authenticate_socket(token)

    await sio.save_session(sid, {
        "user_id": user_data["user_id"] if user_data else None,
        "role": user_data["role"] if user_data else "anonymous",
        "streams": set(),
        "connected_at": time.time(),
    })

    logger.info(f"Socket connected: sid={sid} user={user_data['user_id'] if user_data else 'anonymous'}")


@sio.event
async def disconnect(sid):
    """Handle client disconnection — clean up rooms and viewer counts."""
    session = await sio.get_session(sid)
    r = await get_redis()

    # Leave all streams
    for stream_id in session.get("streams", set()):
        await r.srem(f"viewers:{stream_id}", sid)
        count = await r.scard(f"viewers:{stream_id}")
        await sio.emit("viewer_count", {"stream_id": stream_id, "count": count}, room=f"stream:{stream_id}")

        # Remove from panel if in one
        await r.srem(f"panel:{stream_id}", sid)

    logger.info(f"Socket disconnected: sid={sid}")


# ── Stream Room Events ───────────────────────────────────────────────

@sio.event
async def join_stream(sid, data):
    """Join a stream room for chat and updates."""
    stream_id = data.get("stream_id")
    if not stream_id:
        return {"error": "stream_id required"}

    room = f"stream:{stream_id}"
    await sio.enter_room(sid, room)

    session = await sio.get_session(sid)
    streams = session.get("streams", set())
    streams.add(stream_id)
    session["streams"] = streams
    await sio.save_session(sid, session)

    # Track viewer
    r = await get_redis()
    await r.sadd(f"viewers:{stream_id}", sid)
    count = await r.scard(f"viewers:{stream_id}")

    await sio.emit("viewer_count", {"stream_id": stream_id, "count": count}, room=room)

    logger.debug(f"Joined stream: sid={sid} stream={stream_id} viewers={count}")
    return {"success": True, "viewer_count": count}


@sio.event
async def leave_stream(sid, data):
    """Leave a stream room."""
    stream_id = data.get("stream_id")
    if not stream_id:
        return {"error": "stream_id required"}

    room = f"stream:{stream_id}"
    await sio.leave_room(sid, room)

    session = await sio.get_session(sid)
    streams = session.get("streams", set())
    streams.discard(stream_id)
    session["streams"] = streams
    await sio.save_session(sid, session)

    r = await get_redis()
    await r.srem(f"viewers:{stream_id}", sid)
    count = await r.scard(f"viewers:{stream_id}")

    await sio.emit("viewer_count", {"stream_id": stream_id, "count": count}, room=room)
    return {"success": True}


# ── Panel Events ─────────────────────────────────────────────────────

@sio.event
async def join_panel(sid, data):
    """Join a stream panel (max 20 participants)."""
    stream_id = data.get("stream_id")
    if not stream_id:
        return {"error": "stream_id required"}

    r = await get_redis()
    panel_key = f"panel:{stream_id}"

    # Enforce 20-person limit
    current_count = await r.scard(panel_key)
    if current_count >= 20:
        return {"error": "Panel is full (max 20 participants)", "full": True}

    await r.sadd(panel_key, sid)
    session = await sio.get_session(sid)

    # Broadcast panel update
    members = await r.smembers(panel_key)
    await sio.emit("panel_update", {
        "stream_id": stream_id,
        "count": len(members),
        "action": "join",
        "user_id": session.get("user_id"),
    }, room=f"stream:{stream_id}")

    return {"success": True, "panel_count": len(members)}


@sio.event
async def leave_panel(sid, data):
    """Leave a stream panel."""
    stream_id = data.get("stream_id")
    if not stream_id:
        return {"error": "stream_id required"}

    r = await get_redis()
    panel_key = f"panel:{stream_id}"
    await r.srem(panel_key, sid)

    session = await sio.get_session(sid)
    members = await r.smembers(panel_key)

    await sio.emit("panel_update", {
        "stream_id": stream_id,
        "count": len(members),
        "action": "leave",
        "user_id": session.get("user_id"),
    }, room=f"stream:{stream_id}")

    return {"success": True}


# ── Chat Events ──────────────────────────────────────────────────────

@sio.event
async def chat_message(sid, data):
    """Broadcast a chat message to the stream room."""
    stream_id = data.get("stream_id")
    content = data.get("content", "").strip()

    if not stream_id or not content:
        return {"error": "stream_id and content required"}

    if len(content) > 500:
        return {"error": "Message too long (max 500 characters)"}

    session = await sio.get_session(sid)
    user_id = session.get("user_id")

    message_data = {
        "stream_id": stream_id,
        "user_id": user_id,
        "username": data.get("username", "Anonymous"),
        "content": content,
        "platform": data.get("platform", "native"),
        "type": "message",
        "timestamp": time.time(),
    }

    # Broadcast to stream room
    await sio.emit("chat_message", message_data, room=f"stream:{stream_id}")

    # Trigger async AI moderation (non-blocking)
    try:
        from services.ai_wrapper import ai_wrapper
        import asyncio
        asyncio.create_task(_moderate_message(stream_id, message_data))
    except Exception as e:
        logger.warning(f"Could not trigger moderation: {e}")

    return {"success": True}


async def _moderate_message(stream_id: str, message_data: dict):
    """Background AI moderation for a chat message."""
    try:
        from services.ai_wrapper import ai_wrapper
        result = await ai_wrapper.moderate(message_data["content"])
        if not result.get("safe", True):
            await sio.emit("chat_moderation", {
                "stream_id": stream_id,
                "message_id": message_data.get("id"),
                "username": message_data.get("username"),
                "category": result.get("category"),
                "confidence": result.get("confidence"),
                "reason": result.get("reason"),
            }, room=f"stream:{stream_id}")
    except Exception as e:
        logger.error(f"Moderation failed: {e}")


# ── Watch Party Events ───────────────────────────────────────────────

@sio.event
async def watch_party_action(sid, data):
    """Host sends playback control action."""
    stream_id = data.get("stream_id")
    action = data.get("action")

    if not stream_id or not action:
        return {"error": "stream_id and action required"}

    session = await sio.get_session(sid)
    user_id = session.get("user_id")

    try:
        from services.watch_party import watch_party_manager

        kwargs = {}
        if action == "seek":
            kwargs["time"] = data.get("time", 0)
        elif action == "load":
            kwargs["media_url"] = data.get("media_url", "")

        sync_payload = await watch_party_manager.host_action(stream_id, user_id, action, **kwargs)

        # Broadcast sync to all viewers
        await sio.emit("watch_party_sync", sync_payload, room=f"stream:{stream_id}")

        return {"success": True, "sync": sync_payload}
    except PermissionError as e:
        return {"error": str(e)}
    except ValueError as e:
        return {"error": str(e)}


@sio.event
async def watch_party_request_sync(sid, data):
    """Viewer requests current watch party state (on join/reconnect)."""
    stream_id = data.get("stream_id")
    if not stream_id:
        return {"error": "stream_id required"}

    try:
        from services.watch_party import watch_party_manager
        sync_state = await watch_party_manager.get_sync_state(stream_id)
        if sync_state:
            await sio.emit("watch_party_sync", sync_state, to=sid)
            return {"success": True}
        return {"error": "No active watch party"}
    except Exception as e:
        return {"error": str(e)}


# ── Personal Room Events ────────────────────────────────────────────

@sio.event
async def join_user_room(sid, data):
    """Subscribe to personal notifications (gamification, payments)."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        return {"error": "Authentication required"}

    await sio.enter_room(sid, f"user:{user_id}")
    return {"success": True}


# ── WebRTC Signaling Events ─────────────────────────────────────────

@sio.event
async def webrtc_offer(sid, data):
    """Forward WebRTC SDP offer to target peer."""
    target_sid = data.get("target_sid")
    if target_sid:
        await sio.emit("webrtc_offer", {
            "from_sid": sid,
            "offer": data.get("offer"),
        }, to=target_sid)


@sio.event
async def webrtc_answer(sid, data):
    """Forward WebRTC SDP answer to target peer."""
    target_sid = data.get("target_sid")
    if target_sid:
        await sio.emit("webrtc_answer", {
            "from_sid": sid,
            "answer": data.get("answer"),
        }, to=target_sid)


@sio.event
async def webrtc_ice_candidate(sid, data):
    """Forward WebRTC ICE candidate to target peer."""
    target_sid = data.get("target_sid")
    if target_sid:
        await sio.emit("webrtc_ice_candidate", {
            "from_sid": sid,
            "candidate": data.get("candidate"),
        }, to=target_sid)


# ── Stream Metrics Events ───────────────────────────────────────────

@sio.event
async def stream_metrics(sid, data):
    """Host sends real-time stream metrics."""
    stream_id = data.get("stream_id")
    if not stream_id:
        return

    session = await sio.get_session(sid)
    if session.get("role") not in ("admin", "creator"):
        return

    # Store in Redis for analytics
    r = await get_redis()
    await r.hset(f"metrics:{stream_id}", mapping={
        "viewer_count": data.get("viewer_count", 0),
        "chat_rate": data.get("chat_rate", 0),
        "timestamp": str(time.time()),
    })
    await r.expire(f"metrics:{stream_id}", 86400)


# ── Helper Functions for Route Handlers ──────────────────────────────

async def emit_gamification_event(user_id: str, event_type: str, data: dict):
    """Emit a gamification event to a user's personal room."""
    await sio.emit("gamification", {
        "type": event_type,
        **data,
    }, room=f"user:{user_id}")


async def emit_payment_received(user_id: str, data: dict):
    """Emit a payment notification to a user."""
    await sio.emit("payment_received", data, room=f"user:{user_id}")


async def emit_to_stream(stream_id: str, event: str, data: dict):
    """Emit an event to all users in a stream room."""
    await sio.emit(event, data, room=f"stream:{stream_id}")


async def cleanup():
    """Clean up Redis connection on shutdown."""
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None
