import uvicorn
from fastapi import FastAPI
from api.config import settings
from api.database import init_db, close_db
from api.middleware import setup_cors, RateLimitMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()

from api.routers import root_router

app = FastAPI(
    title="SwanyThree API",
    description="Production-grade backend for the SwanyThree live-streaming platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Setup Middleware
setup_cors(app)
app.add_middleware(RateLimitMiddleware)

# Setup Routers
app.include_router(root_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENV,
        "features": {
            "ai": settings.DEFAULT_LLM_MODEL,
            "stripe": "enabled" if settings.STRIPE_SECRET_KEY else "disabled"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=settings.API_PORT, 
        reload=(settings.ENV == "development")
    )
