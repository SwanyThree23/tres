"""SwanyThree Rate Limiting — Redis sliding window rate limiter."""

import time
import logging
from typing import Optional, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
import redis.asyncio as aioredis

from api.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path-based rate limit rules (prefix -> requests per minute)
# ---------------------------------------------------------------------------

_RATE_LIMITS: list[Tuple[str, int]] = [
    ("/api/payments", 20),
    ("/api/admin", 30),
]
_DEFAULT_RATE_LIMIT: int = 120


def _resolve_limit(path: str) -> Tuple[str, int]:
    """Return ``(path_prefix, max_requests_per_minute)`` for the given path.

    The first matching prefix wins.  If no specific prefix matches the
    default limit is returned with ``"default"`` as the prefix key.
    """
    for prefix, limit in _RATE_LIMITS:
        if path.startswith(prefix):
            return prefix, limit
    return "default", _DEFAULT_RATE_LIMIT


def _extract_client_ip(request: Request) -> str:
    """Extract the originating client IP address.

    Checks the ``X-Forwarded-For`` header first (taking the left-most
    address, which is the original client) and falls back to
    ``request.client.host``.
    """
    forwarded_for: Optional[str] = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For may contain a comma-separated chain of proxies.
        # The first address is the real client.
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that enforces per-IP rate limits using a Redis
    sliding-window counter.

    Each unique ``(ip, path_prefix, minute_bucket)`` tuple gets its own
    Redis key with a 60-second TTL.  When the counter exceeds the
    configured limit a **429 Too Many Requests** response is returned
    with a ``Retry-After`` header.

    If the Redis connection is unavailable the request is allowed through
    so that a Redis outage does not take down the entire API (open
    failure mode).
    """

    def __init__(self, app, redis_url: Optional[str] = None) -> None:  # noqa: ANN001
        super().__init__(app)
        url = redis_url or settings.REDIS_URL
        self._redis: aioredis.Redis = aioredis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )

    async def dispatch(self, request: Request, call_next) -> Response:  # noqa: ANN001
        """Process an incoming request through the rate limiter."""
        client_ip = _extract_client_ip(request)
        path = request.url.path
        path_prefix, max_requests = _resolve_limit(path)

        # Build a Redis key scoped to the current minute bucket.
        minute_bucket = int(time.time()) // 60
        redis_key = f"rl:{client_ip}:{path_prefix}:{minute_bucket}"

        try:
            current_count = await self._redis.incr(redis_key)
            if current_count == 1:
                # First request in this window — set the TTL.
                await self._redis.expire(redis_key, 60)

            if current_count > max_requests:
                # Calculate how many seconds remain in the current window.
                ttl = await self._redis.ttl(redis_key)
                retry_after = max(ttl, 1)

                logger.warning(
                    "Rate limit exceeded: ip=%s path_prefix=%s count=%d limit=%d",
                    client_ip,
                    path_prefix,
                    current_count,
                    max_requests,
                )

                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Please try again later.",
                        "retry_after": retry_after,
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            remaining = max(max_requests - current_count, 0)

        except (aioredis.RedisError, ConnectionError, OSError) as exc:
            # Open failure: if Redis is unreachable, allow the request.
            logger.error("Rate limiter Redis error (allowing request): %s", exc)
            response: Response = await call_next(request)
            return response

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
