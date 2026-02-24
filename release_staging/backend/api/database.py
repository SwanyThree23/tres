"""
SwanyThree Platform — async SQLAlchemy database setup.

Provides:
- ``engine``        – the async engine bound to DATABASE_URL
- ``async_session`` – session factory for request-scoped sessions
- ``Base``          – declarative base for ORM models
- ``get_db()``      – FastAPI dependency that yields an AsyncSession
- ``init_db()``     – call once at startup (creates pool, optional table creation)
- ``close_db()``    – call once at shutdown (disposes engine)
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from api.config import settings

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENV != "production"),
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ---------------------------------------------------------------------------
# Declarative base
# ---------------------------------------------------------------------------

Base = declarative_base()

# ---------------------------------------------------------------------------
# Context manager for manual usage
# ---------------------------------------------------------------------------


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager that yields an ``AsyncSession`` and handles
    commit / rollback automatically."""
    session = async_session()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session for a single request via ``Depends(get_db)``."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ---------------------------------------------------------------------------
# Lifespan helpers
# ---------------------------------------------------------------------------


async def init_db() -> None:
    """Initialise the database connection pool.

    Call this inside the FastAPI lifespan *startup* phase.  If you need to
    create tables for development / testing you can uncomment the block
    below, but in production Alembic migrations should be used instead.
    """
    # Ensure the pool is established by issuing a trivial connect.
    async with engine.begin() as conn:
        # Uncomment the next line ONLY for local dev / tests:
        await conn.run_sync(Base.metadata.create_all)
        pass


async def close_db() -> None:
    """Dispose of the engine and release the connection pool.

    Call this inside the FastAPI lifespan *shutdown* phase.
    """
    await engine.dispose()
