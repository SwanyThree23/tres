"""SwanyThree Authentication — JWT access/refresh tokens with bcrypt password hashing."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.database import get_db
from models.entities import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt.

    Returns the full bcrypt hash string (algorithm prefix + salt + digest).
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash.

    Returns ``True`` when the password matches, ``False`` otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# Token creation
# ---------------------------------------------------------------------------


def create_access_token(user_id: str, role: str) -> str:
    """Create a short-lived JWT access token.

    The payload contains:
    - ``sub``  – the user ID (string)
    - ``role`` – the user's role (e.g. ``"admin"``, ``"creator"``, ``"user"``)
    - ``exp``  – expiration timestamp (now + ACCESS_TOKEN_EXPIRE_MINUTES)
    - ``iat``  – issued-at timestamp
    - ``type`` – fixed ``"access"``
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "iat": now,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a long-lived JWT refresh token.

    The payload contains:
    - ``sub``  – the user ID (string)
    - ``exp``  – expiration timestamp (now + REFRESH_TOKEN_EXPIRE_DAYS)
    - ``iat``  – issued-at timestamp
    - ``type`` – fixed ``"refresh"``
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": now,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Token decoding
# ---------------------------------------------------------------------------


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token.

    Raises ``HTTPException(401)`` when the token is expired, malformed, or
    otherwise invalid.

    Returns the full decoded payload dictionary on success.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as exc:
        logger.warning("JWT decode failure: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency — resolve the current authenticated user.

    Steps:
    1. Extract the bearer token from the ``Authorization`` header.
    2. Decode and validate the JWT (must be an *access* token).
    3. Look up the user by ID in the database.
    4. Verify the user exists and is active.

    Raises ``HTTPException(401)`` on any failure.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """FastAPI dependency — ensures the current user has the ``admin`` role.

    Raises ``HTTPException(403)`` if the user is not an admin.
    """
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )
    return current_user


async def require_creator(
    current_user: User = Depends(get_current_user),
) -> User:
    """FastAPI dependency — ensures the current user is an admin or creator.

    Raises ``HTTPException(403)`` if the user's role is neither ``admin``
    nor ``creator``.
    """
    if getattr(current_user, "role", None) not in ("admin", "creator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator or administrator privileges required.",
        )
    return current_user


async def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """FastAPI dependency — return the authenticated user *if* a valid token
    is present, otherwise return ``None``.

    Unlike :func:`get_current_user` this dependency never raises an
    exception for missing or invalid credentials, making it suitable for
    endpoints that behave differently for authenticated vs. anonymous users.
    """
    if credentials is None:
        return None

    try:
        payload = decode_token(credentials.credentials)
    except HTTPException:
        return None

    if payload.get("type") != "access":
        return None

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        return None

    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
    except Exception:
        logger.debug("optional_user: DB lookup failed for user_id=%s", user_id)
        return None

    if user is None or not getattr(user, "is_active", True):
        return None

    return user
