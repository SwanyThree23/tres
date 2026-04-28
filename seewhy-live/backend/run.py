"""Entrypoint: wraps the ASGI app (FastAPI + Socket.IO) with uvicorn."""
import uvicorn
from api.main import socket_app

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8000, log_level="info")
