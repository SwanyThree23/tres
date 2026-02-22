import logging
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.entities import Stream, StreamAnalytics, Transaction, TransactionStatus, TransactionType
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service to aggregate and retrieve stream and platform analytics."""

    async def get_stream_summary(self, db: AsyncSession, stream_id: UUID) -> Optional[Dict[str, Any]]:
        """Retrieve a summary of analytics for a specific stream."""
        # 1. Fetch the analytics record
        result = await db.execute(select(StreamAnalytics).where(StreamAnalytics.stream_id == stream_id))
        analytics = result.scalars().first()
        
        if not analytics:
            return None

        # 2. Fetch revenue summary from transactions
        revenue_result = await db.execute(
            select(func.sum(Transaction.amount))
            .where(
                Transaction.stream_id == stream_id,
                Transaction.status == TransactionStatus.completed,
                Transaction.type.in_([TransactionType.donation, TransactionType.tip])
            )
        )
        total_tips = revenue_result.scalar() or 0.0

        return {
            "stream_id": stream_id,
            "viewers": {
                "total": analytics.total_viewers,
                "peak": analytics.peak_concurrent,
                "avg_watch_time": analytics.avg_watch_time_seconds,
            },
            "engagement": {
                "chat_messages": analytics.chat_message_count,
                "new_followers": analytics.new_followers,
            },
            "revenue": {
                "total": analytics.revenue,
                "tips": float(total_tips),
            },
            "timeline": analytics.viewer_timeline
        }

    async def record_viewer_count(self, db: AsyncSession, stream_id: UUID, count: int):
        """Update live viewer stats for a stream."""
        result = await db.execute(select(StreamAnalytics).where(StreamAnalytics.stream_id == stream_id))
        analytics = result.scalars().first()
        
        if not analytics:
            # Create if missing
            analytics = StreamAnalytics(stream_id=stream_id, total_viewers=count, peak_concurrent=count)
            db.add(analytics)
        else:
            analytics.peak_concurrent = max(analytics.peak_concurrent, count)
            # Logic for timeline update
            if not analytics.viewer_timeline:
                analytics.viewer_timeline = []
            analytics.viewer_timeline.append({
                "timestamp": datetime.utcnow().isoformat(),
                "count": count
            })
            
        await db.commit()

analytics_service = AnalyticsService()
