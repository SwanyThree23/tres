"""
SwanyThree Platform — application configuration.

All settings are loaded from environment variables (or a .env file).
Import the singleton ``settings`` object wherever configuration is needed.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration sourced from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── General ───────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str
    API_PORT: int = 8000

    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── Redis ─────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://redis:6379/0"

    # ── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ── Stripe ────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    PLATFORM_FEE_PERCENT: float = 0.10

    # ── AI / LLM ──────────────────────────────────────────────────────────
    OLLAMA_URL: str = "http://ollama:11434"
    WHISPER_URL: str = "http://whisper:8001"
    DEFAULT_LLM_MODEL: str = "llama3.2:3b"
    OPENROUTER_API_KEY: str = ""
    LLMLINGUA_ENDPOINT: str = "http://llmlingua:8100"

    # ── Security / Vault ──────────────────────────────────────────────────
    VAULT_MASTER_KEY: str

    # ── Media / Streaming ─────────────────────────────────────────────────
    MEDIASOUP_ANNOUNCED_IP: str = "127.0.0.1"
    RTMP_URL: str = "rtmp://rtmp:1935/live"

    # ── Cloudflare R2 ─────────────────────────────────────────────────────
    CLOUDFLARE_R2_ENDPOINT: str = ""
    CLOUDFLARE_R2_ACCESS_KEY: str = ""
    CLOUDFLARE_R2_SECRET_KEY: str = ""
    CLOUDFLARE_R2_BUCKET: str = "swanythree"

    # ── MCP ────────────────────────────────────────────────────────────────
    MCP_API_TOKEN: str = ""

    # ── XP / Gamification streak multipliers ──────────────────────────────
    XP_STREAK_7: float = 1.5
    XP_STREAK_14: float = 2.0
    XP_STREAK_30: float = 2.5
    XP_STREAK_60: float = 3.0

    # ── Email / SMTP ──────────────────────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # ── Celery ────────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://redis:6379/1"

    # ── Auth tokens ───────────────────────────────────────────────────────
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Computed helpers ──────────────────────────────────────────────────

    @property
    def parsed_cors_origins(self) -> List[str]:
        """Return CORS_ORIGINS split into a list of origin strings."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


# ---------------------------------------------------------------------------
# Singleton – import ``settings`` directly from this module.
# ---------------------------------------------------------------------------

settings = Settings()  # type: ignore[call-arg]
