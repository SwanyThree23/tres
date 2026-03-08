"""SwanyThree Admin Routes — Platform management."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from api.config import settings
from api.database import get_db
from api.middleware.auth import get_current_user, require_admin
from models.entities import User, Stream, Transaction

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/metrics")
async def platform_metrics(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide metrics."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )).scalar() or 0

    total_streams = (await db.execute(select(func.count(Stream.id)))).scalar() or 0
    live_streams = (await db.execute(
        select(func.count(Stream.id)).where(Stream.status == "live")
    )).scalar() or 0

    revenue_result = await db.execute(
        select(
            func.coalesce(func.sum(Transaction.gross_amount), 0).label("total_gross"),
            func.coalesce(func.sum(Transaction.platform_fee), 0).label("total_platform_fee"),
            func.coalesce(func.sum(Transaction.net_amount), 0).label("total_net"),
            func.count(Transaction.id).label("total_transactions"),
        ).where(Transaction.status == "completed")
    )
    rev = revenue_result.fetchone()

    return {
        "success": True,
        "metrics": {
            "users": {"total": total_users, "active": active_users},
            "streams": {"total": total_streams, "live": live_streams},
            "revenue": {
                "total_gross": float(rev.total_gross) if rev else 0,
                "total_platform_fee": float(rev.total_platform_fee) if rev else 0,
                "total_net": float(rev.total_net) if rev else 0,
                "total_transactions": rev.total_transactions if rev else 0,
            },
        },
    }


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=100),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and search."""
    offset = (page - 1) * page_size
    query = select(User)
    count_query = select(func.count(User.id))

    if search:
        filter_cond = User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        query = query.where(filter_cond)
        count_query = count_query.where(filter_cond)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(query.order_by(User.created_at.desc()).offset(offset).limit(page_size))
    users = result.scalars().all()

    return {
        "success": True,
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "display_name": u.display_name,
                "role": u.role,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "follower_count": u.follower_count,
                "created_at": str(u.created_at),
                "last_login_at": str(u.last_login_at) if u.last_login_at else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/health")
async def system_health(current_user: User = Depends(require_admin)):
    """Check system health — database, Redis, services."""
    health = {"database": False, "redis": False}

    # Database
    try:
        from api.database import async_engine
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health["database"] = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    # Redis
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
        health["redis"] = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")

    all_healthy = all(health.values())
    return {
        "success": True,
        "status": "healthy" if all_healthy else "degraded",
        "services": health,
    }
