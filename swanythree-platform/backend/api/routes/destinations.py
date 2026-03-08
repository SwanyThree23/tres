"""SwanyThree Destination Routes — RTMP fanout, stream key encryption via Vault."""

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
from models.entities import (
    DestinationPlatform,
    Stream,
    StreamDestination,
    StreamGuest,
    StreamStatus,
    User,
)
from services.vault import vault

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/destinations", tags=["Destinations"])

REDIS_FANOUT_PREFIX = "rtmp_fanout"
FANOUT_TTL_SECONDS = 43200  # 12 hours


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class SealKeyRequest(BaseModel):
    platform: str = Field(..., pattern=r"^(youtube|twitch|facebook|custom_rtmp)$")
    rtmp_url: str = Field(..., min_length=1, max_length=2048)
    stream_key: str = Field(..., min_length=1, max_length=1024)


class StartFanoutRequest(BaseModel):
    platform: str = Field(..., pattern=r"^(youtube|twitch|facebook|custom_rtmp)$")
    rtmp_url: str = Field(..., min_length=1, max_length=2048)
    sealed_key: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/seal-key")
async def seal_stream_key(
    req: SealKeyRequest,
    current_user: User = Depends(get_current_user),
):
    """Encrypt a stream key via Vault for secure storage."""
    if vault is None:
        raise HTTPException(status_code=503, detail="Vault service is not available")

    try:
        sealed = vault.seal_stream_key(
            platform=req.platform,
            rtmp_url=req.rtmp_url,
            stream_key=req.stream_key,
        )
    except Exception as exc:
        logger.error("Failed to seal stream key: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to encrypt stream key")

    logger.info("Stream key sealed for platform %s by user %s", req.platform, current_user.username)

    return {
        "success": True,
        "sealed_key": sealed,
        "platform": req.platform,
    }


@router.post("/{guest_id}/start", status_code=201)
async def start_fanout(
    guest_id: UUID,
    req: StartFanoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    """Start RTMP fanout for a stream guest's destination."""
    guest_result = await db.execute(
        select(StreamGuest).where(StreamGuest.id == guest_id)
    )
    guest = guest_result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    stream_result = await db.execute(select(Stream).where(Stream.id == guest.stream_id))
    stream = stream_result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    if stream.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the stream owner can manage fanout")

    if vault is None:
        raise HTTPException(status_code=503, detail="Vault service is not available")

    try:
        creds = vault.unseal_stream_key(req.sealed_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid sealed key: {exc}")

    dest_platform = DestinationPlatform(req.platform)
    destination = StreamDestination(
        stream_id=stream.id,
        platform=dest_platform,
        rtmp_url=req.rtmp_url,
        stream_key_encrypted=req.sealed_key,
        is_active=True,
    )
    db.add(destination)
    await db.flush()

    import json
    now = datetime.now(timezone.utc)
    fanout_key = f"{REDIS_FANOUT_PREFIX}:{guest_id}:{req.platform}"
    fanout_data = {
        "guest_id": str(guest_id),
        "stream_id": str(stream.id),
        "destination_id": str(destination.id),
        "platform": req.platform,
        "rtmp_url": req.rtmp_url,
        "status": "active",
        "started_at": now.isoformat(),
        "started_by": str(current_user.id),
    }
    await redis.set(fanout_key, json.dumps(fanout_data), ex=FANOUT_TTL_SECONDS)

    await db.commit()

    logger.info(
        "Fanout started: guest=%s platform=%s stream=%s",
        guest_id, req.platform, stream.id,
    )

    return {
        "success": True,
        "fanout": {
            "destination_id": str(destination.id),
            "guest_id": str(guest_id),
            "platform": req.platform,
            "status": "active",
            "started_at": now.isoformat(),
        },
    }


@router.post("/{guest_id}/stop")
async def stop_fanout(
    guest_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    """Stop all RTMP fanout destinations for a guest."""
    guest_result = await db.execute(
        select(StreamGuest).where(StreamGuest.id == guest_id)
    )
    guest = guest_result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    stream_result = await db.execute(select(Stream).where(Stream.id == guest.stream_id))
    stream = stream_result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    if stream.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the stream owner can manage fanout")

    dest_result = await db.execute(
        select(StreamDestination).where(
            StreamDestination.stream_id == stream.id,
            StreamDestination.is_active == True,  # noqa: E712
        )
    )
    destinations = dest_result.scalars().all()

    stopped_count = 0
    for dest in destinations:
        dest.is_active = False
        stopped_count += 1

        platform_val = dest.platform.value if hasattr(dest.platform, "value") else str(dest.platform)
        fanout_key = f"{REDIS_FANOUT_PREFIX}:{guest_id}:{platform_val}"
        await redis.delete(fanout_key)

    await db.commit()

    logger.info("Fanout stopped: guest=%s, %d destinations", guest_id, stopped_count)

    return {
        "success": True,
        "message": f"Stopped {stopped_count} fanout destination(s)",
        "stopped_count": stopped_count,
    }


@router.get("/status")
async def get_all_active_fanouts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    """Get all active fanout destinations for streams owned by the current user."""
    stream_result = await db.execute(
        select(Stream).where(
            Stream.user_id == current_user.id,
            Stream.status == StreamStatus.live,
        )
    )
    streams = stream_result.scalars().all()
    stream_ids = [s.id for s in streams]

    if not stream_ids:
        return {"success": True, "fanouts": [], "total": 0}

    dest_result = await db.execute(
        select(StreamDestination, Stream)
        .join(Stream, StreamDestination.stream_id == Stream.id)
        .where(
            StreamDestination.stream_id.in_(stream_ids),
            StreamDestination.is_active == True,  # noqa: E712
        )
        .order_by(StreamDestination.created_at.desc())
    )
    rows = dest_result.all()

    fanouts = []
    for dest, stream in rows:
        fanouts.append({
            "destination_id": str(dest.id),
            "stream_id": str(dest.stream_id),
            "stream_title": stream.title,
            "platform": dest.platform.value if hasattr(dest.platform, "value") else str(dest.platform),
            "rtmp_url": dest.rtmp_url,
            "is_active": dest.is_active,
            "created_at": dest.created_at.isoformat() if dest.created_at else "",
        })

    return {"success": True, "fanouts": fanouts, "total": len(fanouts)}


@router.get("/{guest_id}")
async def get_guest_fanout_status(
    guest_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    """Get fanout status for a specific guest."""
    import json

    guest_result = await db.execute(
        select(StreamGuest).where(StreamGuest.id == guest_id)
    )
    guest = guest_result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    stream_result = await db.execute(select(Stream).where(Stream.id == guest.stream_id))
    stream = stream_result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    if stream.user_id != current_user.id and guest.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this fanout status")

    active_fanouts = []
    for platform in DestinationPlatform:
        fanout_key = f"{REDIS_FANOUT_PREFIX}:{guest_id}:{platform.value}"
        fanout_raw = await redis.get(fanout_key)
        if fanout_raw:
            fanout_data = json.loads(fanout_raw)
            active_fanouts.append(fanout_data)

    dest_result = await db.execute(
        select(StreamDestination).where(
            StreamDestination.stream_id == stream.id,
        ).order_by(StreamDestination.created_at.desc())
    )
    db_destinations = dest_result.scalars().all()

    destinations = [
        {
            "id": str(d.id),
            "platform": d.platform.value if hasattr(d.platform, "value") else str(d.platform),
            "rtmp_url": d.rtmp_url,
            "is_active": d.is_active,
            "created_at": d.created_at.isoformat() if d.created_at else "",
        }
        for d in db_destinations
    ]

    return {
        "success": True,
        "guest_id": str(guest_id),
        "stream_id": str(stream.id),
        "active_fanouts": active_fanouts,
        "destinations": destinations,
    }
