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
from models.entities import User, Stream, StreamStatus

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


class StreamRead(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    viewer_count: int
    peak_viewers: int
    category: Optional[str]
    stream_key: Optional[str] = None   # only returned to stream owner

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

    await db.commit()
    await db.refresh(stream)
    return _stream_to_dict(stream, include_key=True)


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
