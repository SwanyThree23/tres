import socketio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ..core.config import get_settings
from ..core.database import init_db
from .routes import auth, streams, users, watch_party, payments
from .websocket import sio

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="SeeWhy LIVE API",
    description="The live educational streaming platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(streams.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(watch_party.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "seewhy-live-api"}


# Mount Socket.IO as ASGI sub-app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="/socket.io")
