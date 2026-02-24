"""Streams router — create, list, get, update streams."""

import uuid
import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User, Stream, StreamStatus, StreamDestination, DestinationPlatform

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class StreamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_private: bool = False


class StreamPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None   # "live" | "ended" | "scheduled"
    
    # Watch Party Sync
    is_party_active: Optional[bool] = None
    party_url: Optional[str] = None
    party_sync_status: Optional[dict] = None # {time: 0, state: 'playing'}


class DestinationCreate(BaseModel):
    platform: str # youtube, twitch, facebook, custom_rtmp
    rtmp_url: str
    stream_key: str


class DestinationRead(BaseModel):
    id: str
    platform: str
    rtmp_url: str
    is_active: bool

    class Config:
        from_attributes = True


class StreamRead(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    category: Optional[str]
    stream_key: Optional[str] = None   # only returned to stream owner
    
    # Watch Party
    is_party_active: bool
    party_url: Optional[str]
    party_sync_status: Optional[dict]

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _stream_to_dict(stream: Stream, include_key: bool = False) -> dict:
    return {
        "id": str(stream.id),
        "user_id": str(stream.user_id),
        "title": stream.title,
        "description": stream.description,
        "status": str(stream.status),
        "viewer_count": stream.viewer_count,
        "peak_viewers": stream.peak_viewers,
        "category": stream.category,
        "is_party_active": stream.is_party_active,
        "party_url": stream.party_url,
        "party_sync_status": stream.party_sync_status,
        **({"stream_key": stream.stream_key} if include_key else {}),
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[StreamRead])
async def list_streams(
    status: Optional[str] = Query(None, description="Filter by status: live|scheduled|ended"),
    db: AsyncSession = Depends(get_db),
):
    """List streams, optionally filtered by status."""
    q = select(Stream)
    if status:
        try:
            q = q.where(Stream.status == StreamStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status '{status}'.")
    else:
        # Default: return live streams for Browse page
        q = q.where(Stream.status == StreamStatus.live)

    result = await db.execute(q.order_by(Stream.viewer_count.desc()).limit(50))
    return [_stream_to_dict(s) for s in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_stream(
    data: StreamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new stream session for the current user."""
    stream_key = f"sk-{secrets.token_urlsafe(24)}"
    new_stream = Stream(
        id=str(uuid.uuid4()),
        user_id=str(current_user.id),
        title=data.title,
        description=data.description,
        category=data.category,
        is_private=data.is_private,
        status=StreamStatus.scheduled,
        viewer_count=0,
        peak_viewers=0,
        stream_key=stream_key,
    )
    db.add(new_stream)
    await db.commit()
    await db.refresh(new_stream)
    return _stream_to_dict(new_stream, include_key=True)


@router.get("/{stream_id}")
async def get_stream(
    stream_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single stream by ID (public)."""
    result = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = result.scalars().first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found.")
    return _stream_to_dict(stream)


@router.patch("/{stream_id}")
async def update_stream(
    stream_id: str,
    data: StreamPatch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update stream title, description, or status (owner only)."""
    result = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = result.scalars().first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found.")
    if str(stream.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your stream.")

    if data.title is not None:
        stream.title = data.title
    if data.description is not None:
        stream.description = data.description
    if data.status is not None:
        try:
            stream.status = StreamStatus(data.status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status '{data.status}'.")

    # Sync Party attributes
    if data.is_party_active is not None:
        stream.is_party_active = data.is_party_active
    if data.party_url is not None:
        stream.party_url = data.party_url
    if data.party_sync_status is not None:
        stream.party_sync_status = data.party_sync_status

    await db.commit()
    await db.refresh(stream)
    
    # If party state changed, we should ideally notify via WS
    # For now, just return
    return _stream_to_dict(stream, include_key=True)


# ── Destinations Management ───────────────────────────────────────────────────

@router.get("/{stream_id}/destinations", response_model=List[DestinationRead])
async def list_destinations(
    stream_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all broadcast destinations for a stream."""
    q = select(StreamDestination).where(StreamDestination.stream_id == stream_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/{stream_id}/destinations", response_model=DestinationRead)
async def add_destination(
    stream_id: str,
    data: DestinationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new broadcast destination (YouTube, Twitch, etc)."""
    # Verify ownership
    res = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = res.scalars().first()
    if not stream or str(stream.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your stream.")

    new_dest = StreamDestination(
        stream_id=stream_id,
        platform=DestinationPlatform(data.platform),
        rtmp_url=data.rtmp_url,
        stream_key_encrypted=data.stream_key, # In prod, encrypt this!
        is_active=True
    )
    db.add(new_dest)
    await db.commit()
    await db.refresh(new_dest)
    return new_dest


@router.delete("/{stream_id}/destinations/{dest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_destination(
    stream_id: str,
    dest_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a broadcast destination."""
    res = await db.execute(select(StreamDestination).where(StreamDestination.id == dest_id))
    dest = res.scalars().first()
    if not dest or str(dest.stream_id) != stream_id:
        raise HTTPException(status_code=404, detail="Destination not found.")
    
    await db.delete(dest)
    await db.commit()


@router.delete("/{stream_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stream(
    stream_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a stream (owner only)."""
    result = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = result.scalars().first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found.")
    if str(stream.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your stream.")
    await db.delete(stream)
    await db.commit()
