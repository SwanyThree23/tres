from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User, Stream, StreamStatus
from pydantic import BaseModel

router = APIRouter()

class StreamRead(BaseModel):
    id: str
    title: str
    description: str | None
    status: str
    viewer_count: int

    class Config:
        from_attributes = True

class StreamCreate(BaseModel):
    title: str
    description: str | None = None

@router.get("/", response_model=List[StreamRead])
async def list_active_per_streams(db: AsyncSession = Depends(get_db)):
    """List all currently live streams."""
    result = await db.execute(
        select(Stream).where(Stream.status == StreamStatus.live)
    )
    return result.scalars().all()

@router.post("/", response_model=StreamRead)
async def create_stream(
    stream_data: StreamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new stream session for the current user."""
    new_stream = Stream(
        user_id=current_user.id,
        title=stream_data.title,
        description=stream_data.description,
        status=StreamStatus.scheduled
    )
    db.add(new_stream)
    await db.commit()
    await db.refresh(new_stream)
    return new_stream
