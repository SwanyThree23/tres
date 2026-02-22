"""
SwanyThree Platform — shared FastAPI dependencies.

Import these into any router module and use with ``Depends()``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import Settings, settings
from api.database import get_db as _get_db  # noqa: F401 – re-export

# ---------------------------------------------------------------------------
# Re-export: database session
# ---------------------------------------------------------------------------

get_db = _get_db

# ---------------------------------------------------------------------------
# Redis connection
# ---------------------------------------------------------------------------

_redis_pool: aioredis.Redis | None = None


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """Yield an async Redis client backed by a shared connection pool.

    The pool is lazily created on first call and reused for the lifetime of
    the process.
    """
    global _redis_pool

    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )

    yield _redis_pool


# ---------------------------------------------------------------------------
# Settings singleton
# ---------------------------------------------------------------------------


def get_settings() -> Settings:
    """Return the global ``Settings`` singleton."""
    return settings


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20


@dataclass
class Pagination:
    """Resolved pagination parameters."""

    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


def get_pagination(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(
        default=DEFAULT_PAGE_SIZE,
        ge=1,
        le=MAX_PAGE_SIZE,
        description="Items per page",
    ),
) -> Pagination:
    """FastAPI dependency that resolves and validates pagination params."""
    return Pagination(page=page, page_size=page_size)
