"""SwanyThree Watch Party — Synchronized playback with drift correction."""

import time
import json
import logging
from dataclasses import dataclass, asdict
from typing import Optional

import redis.asyncio as aioredis

from api.config import settings

logger = logging.getLogger(__name__)


@dataclass
class WatchPartyState:
    """In-memory state for an active watch party."""
    stream_id: str
    host_id: str
    media_url: str
    is_playing: bool = False
    current_time: float = 0.0
    last_sync_at: float = 0.0
    created_at: float = 0.0


class WatchPartyManager:
    """Manages synchronized watch party playback state."""

    def __init__(self):
        self._parties: dict[str, WatchPartyState] = {}
        self.redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if self.redis is None:
            self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        return self.redis

    async def _save_to_redis(self, state: WatchPartyState) -> None:
        """Persist watch party state to Redis for reconnection support."""
        r = await self._get_redis()
        data = asdict(state)
        await r.set(f"watchparty:{state.stream_id}", json.dumps(data), ex=86400)

    async def _load_from_redis(self, stream_id: str) -> Optional[WatchPartyState]:
        """Load watch party state from Redis."""
        r = await self._get_redis()
        data = await r.get(f"watchparty:{stream_id}")
        if data:
            parsed = json.loads(data)
            return WatchPartyState(**parsed)
        return None

    async def create_party(self, stream_id: str, host_id: str, media_url: str) -> dict:
        """Create a new watch party for a stream.

        Returns sync state payload.
        """
        now = time.time()
        state = WatchPartyState(
            stream_id=stream_id,
            host_id=host_id,
            media_url=media_url,
            is_playing=False,
            current_time=0.0,
            last_sync_at=now,
            created_at=now,
        )
        self._parties[stream_id] = state
        await self._save_to_redis(state)
        logger.info(f"Watch party created: stream={stream_id} host={host_id}")
        return self._build_sync_payload(state)

    async def host_action(self, stream_id: str, host_id: str, action: str, **kwargs) -> dict:
        """Process a host playback action.

        Actions: play, pause, seek, load
        Returns sync payload for broadcasting to viewers.
        """
        state = self._parties.get(stream_id)
        if not state:
            state = await self._load_from_redis(stream_id)
            if state:
                self._parties[stream_id] = state

        if not state:
            raise ValueError(f"No active watch party for stream {stream_id}")

        if state.host_id != host_id:
            raise PermissionError("Only the host can control the watch party")

        now = time.time()

        if action == "play":
            if state.is_playing:
                return self._build_sync_payload(state)
            state.is_playing = True
            state.last_sync_at = now
            logger.info(f"Watch party play: stream={stream_id}")

        elif action == "pause":
            if state.is_playing:
                elapsed = now - state.last_sync_at
                state.current_time += elapsed
            state.is_playing = False
            state.last_sync_at = now
            logger.info(f"Watch party pause: stream={stream_id} at={state.current_time:.1f}s")

        elif action == "seek":
            seek_time = kwargs.get("time", 0.0)
            state.current_time = float(seek_time)
            state.last_sync_at = now
            logger.info(f"Watch party seek: stream={stream_id} to={seek_time:.1f}s")

        elif action == "load":
            new_url = kwargs.get("media_url", state.media_url)
            state.media_url = new_url
            state.current_time = 0.0
            state.is_playing = False
            state.last_sync_at = now
            logger.info(f"Watch party load: stream={stream_id} url={new_url[:50]}")

        else:
            raise ValueError(f"Unknown watch party action: {action}")

        await self._save_to_redis(state)
        return self._build_sync_payload(state)

    async def get_sync_state(self, stream_id: str) -> Optional[dict]:
        """Get current sync state with calculated real-time position.

        For playing state: position = current_time + (now - last_sync_at)
        """
        state = self._parties.get(stream_id)
        if not state:
            state = await self._load_from_redis(stream_id)
            if state:
                self._parties[stream_id] = state

        if not state:
            return None

        return self._build_sync_payload(state)

    async def end_party(self, stream_id: str, host_id: str) -> bool:
        """End a watch party and clean up state."""
        state = self._parties.get(stream_id)
        if state and state.host_id != host_id:
            raise PermissionError("Only the host can end the watch party")

        self._parties.pop(stream_id, None)
        r = await self._get_redis()
        await r.delete(f"watchparty:{stream_id}")
        logger.info(f"Watch party ended: stream={stream_id}")
        return True

    def _build_sync_payload(self, state: WatchPartyState) -> dict:
        """Build sync payload with server time for drift correction."""
        now = time.time()

        # Calculate real-time position
        if state.is_playing:
            elapsed = now - state.last_sync_at
            position = state.current_time + elapsed
        else:
            position = state.current_time

        return {
            "stream_id": state.stream_id,
            "host_id": state.host_id,
            "media_url": state.media_url,
            "is_playing": state.is_playing,
            "current_time": position,
            "server_time": now,
            "is_active": True,
        }

    async def close(self) -> None:
        """Clean up resources."""
        if self.redis:
            await self.redis.aclose()


watch_party_manager = WatchPartyManager()
