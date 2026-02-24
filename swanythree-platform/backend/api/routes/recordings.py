"""SwanyThree Recording Routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User, Recording

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/recordings", tags=["Recordings"])


@router.get("/")
async def list_recordings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recordings for the current user."""
    offset = (page - 1) * page_size

    total_result = await db.execute(
        select(func.count(Recording.id)).where(Recording.user_id == current_user.id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(Recording)
        .where(Recording.user_id == current_user.id)
        .order_by(Recording.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    recordings = result.scalars().all()

    return {
        "success": True,
        "recordings": [
            {
                "id": str(r.id),
                "stream_id": str(r.stream_id),
                "title": r.title,
                "file_url": r.file_url,
                "thumbnail_url": r.thumbnail_url,
                "duration_seconds": r.duration_seconds,
                "file_size_bytes": r.file_size_bytes,
                "format": r.format,
                "resolution": r.resolution,
                "transcode_status": r.transcode_status,
                "created_at": str(r.created_at),
            }
            for r in recordings
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{recording_id}")
async def get_recording(
    recording_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get recording details."""
    result = await db.execute(
        select(Recording).where(Recording.id == recording_id, Recording.user_id == current_user.id)
    )
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")

    return {
        "success": True,
        "recording": {
            "id": str(recording.id),
            "stream_id": str(recording.stream_id),
            "title": recording.title,
            "file_url": recording.file_url,
            "thumbnail_url": recording.thumbnail_url,
            "duration_seconds": recording.duration_seconds,
            "file_size_bytes": recording.file_size_bytes,
            "format": recording.format,
            "resolution": recording.resolution,
            "is_multitrack": recording.is_multitrack,
            "is_processed": recording.is_processed,
            "transcode_status": recording.transcode_status,
            "created_at": str(recording.created_at),
        },
    }


@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a recording."""
    result = await db.execute(
        select(Recording).where(Recording.id == recording_id, Recording.user_id == current_user.id)
    )
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")

    await db.delete(recording)
    await db.commit()
    return {"success": True, "message": "Recording deleted"}


@router.post("/{stream_id}/upload")
async def trigger_upload(
    stream_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger recording upload to R2."""
    from workers.recording_tasks import upload_recording

    recording = Recording(
        stream_id=stream_id,
        user_id=current_user.id,
        title=f"Recording - {stream_id[:8]}",
        transcode_status="pending",
    )
    db.add(recording)
    await db.commit()
    await db.refresh(recording)

    upload_recording.delay(str(recording.id), f"/recordings/{stream_id}.mp4")

    return {"success": True, "recording_id": str(recording.id), "status": "upload_queued"}
