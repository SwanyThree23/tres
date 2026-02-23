"""SwanyThree Stream Routes — create, manage, go-live, guests."""

import logging
import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.database import get_db
from api.dependencies import Pagination, get_pagination
from api.middleware.auth import get_current_user, require_creator
from models.entities import (
    GuestRole,
    Notification,
    NotificationType,
    Stream,
    StreamGuest,
    StreamStatus,
    User,
    UserGamification,
    XPAction,
    XPHistory,
    StreamAnalytics,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/streams", tags=["Streams"])

XP_STREAM_START = 50


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class CreateStreamRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=100)
    tags: list[str] | None = None
    is_private: bool = False
    scheduled_at: datetime | None = None
    thumbnail_url: str | None = None


class UpdateStreamRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=100)
    tags: list[str] | None = None
    is_private: bool | None = None
    thumbnail_url: str | None = None
    scheduled_at: datetime | None = None


class CreateGuestRequest(BaseModel):
    user_id: UUID
    role: str = Field(default="guest", pattern=r"^(co-host|guest|viewer)$")


class StreamOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None
    thumbnail_url: str | None
    status: str
    is_private: bool
    viewer_count: int
    peak_viewers: int
    category: str | None
    tags: list | None
    scheduled_at: str | None
    started_at: str | None
    ended_at: str | None
    mediasoup_room_id: str | None
    created_at: str


class GuestOut(BaseModel):
    id: str
    stream_id: str
    user_id: str
    username: str
    display_name: str | None
    role: str
    joined_at: str | None
    created_at: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _stream_to_dict(stream: Stream) -> dict:
    return StreamOut(
        id=str(stream.id),
        user_id=str(stream.user_id),
        title=stream.title,
        description=stream.description,
        thumbnail_url=stream.thumbnail_url,
        status=stream.status.value if hasattr(stream.status, "value") else str(stream.status),
        is_private=stream.is_private,
        viewer_count=stream.viewer_count,
        peak_viewers=stream.peak_viewers,
        category=stream.category,
        tags=stream.tags,
        scheduled_at=stream.scheduled_at.isoformat() if stream.scheduled_at else None,
        started_at=stream.started_at.isoformat() if stream.started_at else None,
        ended_at=stream.ended_at.isoformat() if stream.ended_at else None,
        mediasoup_room_id=stream.mediasoup_room_id,
        created_at=stream.created_at.isoformat() if stream.created_at else "",
    ).model_dump()


def _generate_stream_key() -> str:
    return f"sk_{secrets.token_urlsafe(32)}"


def _generate_room_id() -> str:
    return f"room_{secrets.token_urlsafe(16)}"


async def _get_stream_or_404(stream_id: UUID, db: AsyncSession) -> Stream:
    result = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    return stream


async def _verify_stream_owner(stream: Stream, user: User) -> None:
    if stream.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not the stream owner")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/", status_code=201)
async def create_stream(
    req: CreateStreamRequest,
    current_user: User = Depends(require_creator),
    db: AsyncSession = Depends(get_db),
):
    """Create a new stream with auto-generated stream_key and room_id."""
    stream = Stream(
        user_id=current_user.id,
        title=req.title,
        description=req.description,
        category=req.category,
        tags=req.tags,
        is_private=req.is_private,
        scheduled_at=req.scheduled_at,
        thumbnail_url=req.thumbnail_url,
        mediasoup_room_id=_generate_room_id(),
    )
    db.add(stream)
    await db.flush()

    stream_key = _generate_stream_key()
    current_user.stream_key = stream_key

    analytics = StreamAnalytics(stream_id=stream.id)
    db.add(analytics)

    await db.commit()
    await db.refresh(stream)

    logger.info("Stream created: %s by user %s", stream.title, current_user.username)

    return {
        "success": True,
        "stream": _stream_to_dict(stream),
        "stream_key": stream_key,
    }


@router.get("/")
async def list_streams(
    status_filter: str | None = Query(None, alias="status"),
    category: str | None = None,
    user_id: UUID | None = None,
    pagination: Pagination = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    """List streams with optional filters and pagination."""
    query = select(Stream).where(Stream.status != StreamStatus.cancelled)

    if status_filter:
        try:
            stream_status = StreamStatus(status_filter)
            query = query.where(Stream.status == stream_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_filter}")

    if category:
        query = query.where(Stream.category == category)

    if user_id:
        query = query.where(Stream.user_id == user_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(Stream.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    result = await db.execute(query)
    streams = result.scalars().all()

    return {
        "success": True,
        "streams": [_stream_to_dict(s) for s in streams],
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
    }


@router.get("/live")
async def list_live_streams(
    pagination: Pagination = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    """List currently live streams ordered by viewer count descending."""
    query = (
        select(Stream)
        .where(Stream.status == StreamStatus.live)
        .order_by(Stream.viewer_count.desc())
    )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(query.offset(pagination.offset).limit(pagination.limit))
    streams = result.scalars().all()

    return {
        "success": True,
        "streams": [_stream_to_dict(s) for s in streams],
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
    }


@router.get("/{stream_id}")
async def get_stream(stream_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get stream details. Includes guests list."""
    result = await db.execute(
        select(Stream)
        .options(selectinload(Stream.guests).selectinload(StreamGuest.user))
        .where(Stream.id == stream_id)
    )
    stream = result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    stream_data = _stream_to_dict(stream)

    host_result = await db.execute(select(User).where(User.id == stream.user_id))
    host = host_result.scalar_one_or_none()
    stream_data["host"] = {
        "id": str(host.id),
        "username": host.username,
        "display_name": host.display_name,
        "avatar_url": host.avatar_url,
    } if host else None

    guests = []
    for g in stream.guests:
        guest_user = g.user
        guests.append(
            GuestOut(
                id=str(g.id),
                stream_id=str(g.stream_id),
                user_id=str(g.user_id),
                username=guest_user.username if guest_user else "unknown",
                display_name=guest_user.display_name if guest_user else None,
                role=g.role.value if hasattr(g.role, "value") else str(g.role),
                joined_at=g.joined_at.isoformat() if g.joined_at else None,
                created_at=g.created_at.isoformat() if g.created_at else "",
            ).model_dump()
        )
    stream_data["guests"] = guests

    return {"success": True, "stream": stream_data}


@router.post("/{stream_id}/go-live")
async def go_live(
    stream_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set a stream to live status, generate URLs, award XP."""
    stream = await _get_stream_or_404(stream_id, db)
    await _verify_stream_owner(stream, current_user)

    if stream.status == StreamStatus.live:
        raise HTTPException(status_code=400, detail="Stream is already live")
    if stream.status == StreamStatus.ended:
        raise HTTPException(status_code=400, detail="Stream has already ended")

    now = datetime.now(timezone.utc)
    stream.status = StreamStatus.live
    stream.started_at = now

    if not stream.mediasoup_room_id:
        stream.mediasoup_room_id = _generate_room_id()

    gam_result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == current_user.id)
    )
    gamification = gam_result.scalar_one_or_none()
    if gamification:
        gamification.xp_total += XP_STREAM_START
        gamification.streams_count += 1

        xp_entry = XPHistory(
            user_id=current_user.id,
            action=XPAction.stream_start,
            xp_amount=XP_STREAM_START,
            metadata_json={"stream_id": str(stream.id), "stream_title": stream.title},
        )
        db.add(xp_entry)

    await db.commit()
    await db.refresh(stream)

    from api.config import settings
    rtmp_url = f"{settings.RTMP_URL}/{current_user.stream_key or ''}"
    webrtc_url = f"wss://{settings.MEDIASOUP_ANNOUNCED_IP}/ws/{stream.mediasoup_room_id}"

    logger.info("Stream %s went live: %s", stream.id, stream.title)

    return {
        "success": True,
        "stream": _stream_to_dict(stream),
        "urls": {
            "rtmp": rtmp_url,
            "webrtc": webrtc_url,
            "room_id": stream.mediasoup_room_id,
        },
        "xp_awarded": XP_STREAM_START,
    }


@router.post("/{stream_id}/end")
async def end_stream(
    stream_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """End a live stream, calculate duration, update gamification."""
    stream = await _get_stream_or_404(stream_id, db)
    await _verify_stream_owner(stream, current_user)

    if stream.status != StreamStatus.live:
        raise HTTPException(status_code=400, detail="Stream is not live")

    now = datetime.now(timezone.utc)
    stream.status = StreamStatus.ended
    stream.ended_at = now

    duration_minutes = 0
    if stream.started_at:
        delta = now - stream.started_at
        duration_minutes = int(delta.total_seconds() / 60)

    gam_result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == current_user.id)
    )
    gamification = gam_result.scalar_one_or_none()
    if gamification and duration_minutes > 0:
        gamification.total_stream_minutes += duration_minutes
        minute_xp = duration_minutes * 2
        gamification.xp_total += minute_xp

        xp_entry = XPHistory(
            user_id=current_user.id,
            action=XPAction.stream_minute,
            xp_amount=minute_xp,
            metadata_json={
                "stream_id": str(stream.id),
                "duration_minutes": duration_minutes,
            },
        )
        db.add(xp_entry)

    analytics_result = await db.execute(
        select(StreamAnalytics).where(StreamAnalytics.stream_id == stream.id)
    )
    analytics = analytics_result.scalar_one_or_none()
    if analytics:
        analytics.peak_concurrent = stream.peak_viewers

    await db.commit()
    await db.refresh(stream)

    logger.info("Stream %s ended after %d minutes", stream.id, duration_minutes)

    return {
        "success": True,
        "stream": _stream_to_dict(stream),
        "duration_minutes": duration_minutes,
    }


@router.patch("/{stream_id}")
async def update_stream(
    stream_id: UUID,
    req: UpdateStreamRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update stream fields. Only the stream owner can update."""
    stream = await _get_stream_or_404(stream_id, db)
    await _verify_stream_owner(stream, current_user)

    updated = {}
    if req.title is not None:
        stream.title = req.title
        updated["title"] = req.title
    if req.description is not None:
        stream.description = req.description
        updated["description"] = req.description
    if req.category is not None:
        stream.category = req.category
        updated["category"] = req.category
    if req.tags is not None:
        stream.tags = req.tags
        updated["tags"] = req.tags
    if req.is_private is not None:
        stream.is_private = req.is_private
        updated["is_private"] = req.is_private
    if req.thumbnail_url is not None:
        stream.thumbnail_url = req.thumbnail_url
        updated["thumbnail_url"] = req.thumbnail_url
    if req.scheduled_at is not None:
        stream.scheduled_at = req.scheduled_at
        updated["scheduled_at"] = req.scheduled_at.isoformat()

    if not updated:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db.commit()
    await db.refresh(stream)

    return {"success": True, "stream": _stream_to_dict(stream), "updated_fields": list(updated.keys())}


@router.delete("/{stream_id}")
async def delete_stream(
    stream_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a stream by setting status to cancelled."""
    stream = await _get_stream_or_404(stream_id, db)
    await _verify_stream_owner(stream, current_user)

    if stream.status == StreamStatus.live:
        stream.ended_at = datetime.now(timezone.utc)

    stream.status = StreamStatus.cancelled

    await db.commit()

    logger.info("Stream %s cancelled by user %s", stream.id, current_user.username)

    return {"success": True, "message": "Stream cancelled"}


@router.post("/{stream_id}/guests", status_code=201)
async def add_guest(
    stream_id: UUID,
    req: CreateGuestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a guest to a stream. Maximum 20 guests per stream."""
    stream = await _get_stream_or_404(stream_id, db)
    await _verify_stream_owner(stream, current_user)

    guest_count = (
        await db.execute(
            select(func.count()).where(StreamGuest.stream_id == stream_id)
        )
    ).scalar() or 0

    if guest_count >= 20:
        raise HTTPException(status_code=400, detail="Maximum 20 guests per stream")

    if req.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a guest")

    guest_user_result = await db.execute(select(User).where(User.id == req.user_id))
    guest_user = guest_user_result.scalar_one_or_none()
    if not guest_user:
        raise HTTPException(status_code=404, detail="Guest user not found")

    existing = await db.execute(
        select(StreamGuest).where(
            StreamGuest.stream_id == stream_id,
            StreamGuest.user_id == req.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User is already a guest")

    guest_role = GuestRole(req.role)
    guest = StreamGuest(
        stream_id=stream_id,
        user_id=req.user_id,
        role=guest_role,
    )
    db.add(guest)

    notification = Notification(
        user_id=req.user_id,
        type=NotificationType.system,
        title="Stream Invitation",
        body=f"You have been invited to join '{stream.title}' as a {req.role}",
        action_url=f"/streams/{stream.id}",
        metadata_json={"stream_id": str(stream.id), "role": req.role},
    )
    db.add(notification)

    await db.commit()
    await db.refresh(guest)

    return {
        "success": True,
        "guest": GuestOut(
            id=str(guest.id),
            stream_id=str(guest.stream_id),
            user_id=str(guest.user_id),
            username=guest_user.username,
            display_name=guest_user.display_name,
            role=guest_role.value,
            joined_at=None,
            created_at=guest.created_at.isoformat() if guest.created_at else "",
        ).model_dump(),
    }


@router.get("/{stream_id}/guests")
async def list_guests(stream_id: UUID, db: AsyncSession = Depends(get_db)):
    """List all guests for a stream."""
    stream = await _get_stream_or_404(stream_id, db)

    result = await db.execute(
        select(StreamGuest, User)
        .join(User, StreamGuest.user_id == User.id)
        .where(StreamGuest.stream_id == stream_id)
        .order_by(StreamGuest.created_at.asc())
    )
    rows = result.all()

    guests = [
        GuestOut(
            id=str(g.id),
            stream_id=str(g.stream_id),
            user_id=str(g.user_id),
            username=u.username,
            display_name=u.display_name,
            role=g.role.value if hasattr(g.role, "value") else str(g.role),
            joined_at=g.joined_at.isoformat() if g.joined_at else None,
            created_at=g.created_at.isoformat() if g.created_at else "",
        ).model_dump()
        for g, u in rows
    ]

    return {"success": True, "guests": guests, "total": len(guests)}


@router.delete("/{stream_id}/guests/{guest_id}")
async def remove_guest(
    stream_id: UUID,
    guest_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a guest from a stream."""
    stream = await _get_stream_or_404(stream_id, db)
    await _verify_stream_owner(stream, current_user)

    result = await db.execute(
        select(StreamGuest).where(
            StreamGuest.id == guest_id,
            StreamGuest.stream_id == stream_id,
        )
    )
    guest = result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found in this stream")

    await db.delete(guest)
    await db.commit()

    logger.info("Guest %s removed from stream %s", guest_id, stream_id)

    return {"success": True, "message": "Guest removed"}
