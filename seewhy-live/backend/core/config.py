from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "SeeWhy LIVE"
    environment: str = "development"
    debug: bool = False

    # Security
    secret_key: str = "change-me-in-production-use-32-bytes"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # Database
    database_url: str = "postgresql+asyncpg://seewhy:password@postgres:5432/seewhy"

    # Redis
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"

    # Anthropic (AI)
    anthropic_api_key: str = ""

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key: str = ""
    r2_secret_key: str = ""
    r2_bucket: str = "seewhy-recordings"
    r2_public_url: str = ""

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "https://www.seewhylive.online",
        "https://seewhylive.online",
    ]

    # RTMP
    rtmp_server: str = "rtmp://localhost:1935/live"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
