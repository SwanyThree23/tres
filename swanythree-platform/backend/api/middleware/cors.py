"""SwanyThree CORS Configuration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.config import settings


def setup_cors(app: FastAPI) -> None:
    """Configure CORS middleware with environment-specific origins.

    Origins are read from ``settings.CORS_ORIGINS`` (a comma-separated
    string) and parsed into a list via
    ``settings.parsed_cors_origins``.

    Exposed headers include rate-limit related headers so that
    browser-based clients can read them from responses.
    """
    origins = settings.parsed_cors_origins

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-RateLimit-Remaining", "X-RateLimit-Limit", "Retry-After"],
    )
