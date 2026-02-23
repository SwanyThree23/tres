"""SwanyThree Platform — FastAPI Application Entry Point.

Production-grade application with lifespan management, middleware stack,
route registration, and Socket.IO integration.
"""

import logging
import sys
from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from api.config import settings
from api.database import init_db, close_db
from api.middleware.cors import setup_cors
from api.middleware.rate_limit import RateLimitMiddleware
from api.websocket import sio, cleanup as ws_cleanup

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENV == "production" else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    logger.info("=" * 60)
    logger.info("SwanyThree Platform starting up...")
    logger.info(f"Environment: {settings.ENV}")
    logger.info("=" * 60)

    # Startup
    await init_db()
    logger.info("Database connection pool initialized")

    yield

    # Shutdown
    logger.info("SwanyThree Platform shutting down...")

    # Stop FFmpeg processes
    try:
        from services.guest_destinations import destination_manager
        await destination_manager.shutdown()
    except Exception as e:
        logger.error(f"Error shutting down destinations: {e}")

    # Close watch party manager
    try:
        from services.watch_party import watch_party_manager
        await watch_party_manager.close()
    except Exception as e:
        logger.error(f"Error closing watch party: {e}")

    # Close AI wrapper
    try:
        from services.ai_wrapper import ai_wrapper
        await ai_wrapper.close()
    except Exception as e:
        logger.error(f"Error closing AI wrapper: {e}")

    # Close WebSocket Redis
    await ws_cleanup()

    # Close database
    await close_db()
    logger.info("All connections closed. Goodbye!")


# Create FastAPI app
app = FastAPI(
    title="SwanyThree Platform API",
    description="Live streaming platform with 90/10 revenue split, 20-guest panels, and AI co-hosting",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
)

# ── Middleware Stack ─────────────────────────────────────────────────
setup_cors(app)
app.add_middleware(RateLimitMiddleware, redis_url=settings.REDIS_URL)


# ── Global Exception Handler ────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler — never expose stack traces in production."""
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}")

    if settings.ENV == "production":
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"},
        )
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
    )


# ── Health Check ─────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Platform health check endpoint."""
    return {
        "status": "healthy",
        "platform": "SwanyThree",
        "version": "1.0.0",
        "environment": settings.ENV,
    }


# ── Register Route Modules ──────────────────────────────────────────
from api.routes.auth import router as auth_router
from api.routes.users import router as users_router
from api.routes.streams import router as streams_router
from api.routes.payments import router as payments_router
from api.routes.gamification import router as gamification_router
from api.routes.watch_party import router as watch_party_router
from api.routes.destinations import router as destinations_router
from api.routes.ai import router as ai_router
from api.routes.chat import router as chat_router
from api.routes.recordings import router as recordings_router
from api.routes.admin import router as admin_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(streams_router)
app.include_router(payments_router)
app.include_router(gamification_router)
app.include_router(watch_party_router)
app.include_router(destinations_router)
app.include_router(ai_router)
app.include_router(chat_router)
app.include_router(recordings_router)
app.include_router(admin_router)


# ── Socket.IO ASGI App ──────────────────────────────────────────────
sio_app = socketio.ASGIApp(sio, other_app=app)

logger.info(f"Registered {len(app.routes)} routes")
