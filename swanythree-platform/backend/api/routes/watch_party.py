"""SwanyThree Watch Party Routes — synchronized playback sessions."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.dependencies import get_redis
from api.middleware.auth import get_current_user
from models.entities import Stream, StreamStatus, User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/watch-party", tags=["Watch Party"])

REDIS_PARTY_PREFIX = "watch_party"
REDIS_SYNC_PREFIX = "watch_party_sync"
PARTY_TTL_SECONDS = 86400  # 24 hours


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class CreateWatchPartyRequest(BaseModel):
    stream_id: UUID
    title: str | None = Field(None, max_length=255)
    media_url: str | None = Field(None, max_length=2048)


class PlaybackActionRequest(BaseModel):
    action: str = Field(..., pattern=r"^(play|pause|seek|load)$")
    position_ms: int = Field(default=0, ge=0)
    media_url: str | None = Field(None, max_length=2048)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/", status_code=201)
async def create_watch_party(
    req: CreateWatchPartyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    """Create a new watch party for a stream."""
    result = await db.execute(select(Stream).where(Stream.id == req.stream_id))
    stream = result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    if stream.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the stream host can create a watch party")

    party_key = f"{REDIS_PARTY_PREFIX}:{req.stream_id}"
    existing = await redis.exists(party_key)
    if existing:
        raise HTTPException(status_code=409, detail="Watch party already exists for this stream")

    import json
    now = datetime.now(timezone.utc)
    party_data = {
        "stream_id": str(req.stream_id),
        "host_id": str(current_user.id),
        "host_username": current_user.username,
        "title": req.title or stream.title,
        "media_url": req.media_url or "",
        "created_at": now.isoformat(),
        "status": "active",
    }
    await redis.set(party_key, json.dumps(party_data), ex=PARTY_TTL_SECONDS)

    sync_key = f"{REDIS_SYNC_PREFIX}:{req.stream_id}"
    sync_state = {
        "action": "pause",
        "position_ms": 0,
        "media_url": req.media_url or "",
        "updated_at": now.isoformat(),
        "updated_by": str(current_user.id),
    }
    await redis.set(sync_key, json.dumps(sync_state), ex=PARTY_TTL_SECONDS)

    logger.info("Watch party created for stream %s by %s", req.stream_id, current_user.username)

    return {
        "success": True,
        "party": party_data,
        "sync": sync_state,
    }


@router.post("/{stream_id}/action")
async def playback_action(
    stream_id: UUID,
    req: PlaybackActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    """Host sends a playback action (play, pause, seek, load) to synchronize all viewers."""
    import json

    party_key = f"{REDIS_PARTY_PREFIX}:{stream_id}"
    party_raw = await redis.get(party_key)
    if not party_raw:
        raise HTTPException(status_code=404, detail="No active watch party for this stream")

    party_data = json.loads(party_raw)

    if party_data.get("host_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the host can control playback")

    now = datetime.now(timezone.utc)
    sync_key = f"{REDIS_SYNC_PREFIX}:{stream_id}"

    sync_state = {
        "action": req.action,
        "position_ms": req.position_ms,
        "media_url": req.media_url or party_data.get("media_url", ""),
        "updated_at": now.isoformat(),
        "updated_by": str(current_user.id),
    }

    if req.action == "load" and req.media_url:
        party_data["media_url"] = req.media_url
        await redis.set(party_key, json.dumps(party_data), ex=PARTY_TTL_SECONDS)

    await redis.set(sync_key, json.dumps(sync_state), ex=PARTY_TTL_SECONDS)

    logger.info(
        "Watch party action: %s at %dms for stream %s",
        req.action, req.position_ms, stream_id,
    )

    return {"success": True, "sync": sync_state}


@router.get("/{stream_id}/sync")
async def get_sync_state(
    stream_id: UUID,
    redis=Depends(get_redis),
):
    """Get the current playback sync state for a watch party."""
    import json

    party_key = f"{REDIS_PARTY_PREFIX}:{stream_id}"
    party_raw = await redis.get(party_key)
    if not party_raw:
        raise HTTPException(status_code=404, detail="No active watch party for this stream")

    party_data = json.loads(party_raw)

    sync_key = f"{REDIS_SYNC_PREFIX}:{stream_id}"
    sync_raw = await redis.get(sync_key)

    if sync_raw:
        sync_state = json.loads(sync_raw)
    else:
        sync_state = {
            "action": "pause",
            "position_ms": 0,
            "media_url": party_data.get("media_url", ""),
            "updated_at": None,
            "updated_by": None,
        }

    return {
        "success": True,
        "party": {
            "stream_id": party_data.get("stream_id"),
            "host_id": party_data.get("host_id"),
            "host_username": party_data.get("host_username"),
            "title": party_data.get("title"),
            "status": party_data.get("status"),
        },
        "sync": sync_state,
    }


@router.delete("/{stream_id}")
async def end_watch_party(
    stream_id: UUID,
    current_user: User = Depends(get_current_user),
    redis=Depends(get_redis),
):
    """End an active watch party."""
    import json

    party_key = f"{REDIS_PARTY_PREFIX}:{stream_id}"
    party_raw = await redis.get(party_key)
    if not party_raw:
        raise HTTPException(status_code=404, detail="No active watch party for this stream")

    party_data = json.loads(party_raw)
    if party_data.get("host_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the host can end the watch party")

    sync_key = f"{REDIS_SYNC_PREFIX}:{stream_id}"
    await redis.delete(party_key)
    await redis.delete(sync_key)

    logger.info("Watch party ended for stream %s by %s", stream_id, current_user.username)

    return {"success": True, "message": "Watch party ended"}
