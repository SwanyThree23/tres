from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from api.database import get_db
from api.middleware.auth import get_current_user
from api.services.analytics import analytics_service
from models.entities import User, Stream

router = APIRouter()

@router.get("/stream/{stream_id}")
async def get_stream_analytics(
    stream_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed analytics for a specific stream."""
    # Check if stream belongs to user or if user is admin
    result = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = result.scalars().first()
    
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
        
    if stream.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view analytics for this stream")

    analytics = await analytics_service.get_stream_summary(db, stream_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Analytics not available for this stream yet")
        
    return analytics

from sqlalchemy import select # Fixed missing import
