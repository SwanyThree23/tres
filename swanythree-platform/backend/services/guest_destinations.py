"""SwanyThree Guest Destinations — FFmpeg RTMP fanout manager.

Manages per-guest, per-platform FFmpeg processes for multi-destination streaming.
"""

import asyncio
import logging
from typing import Optional

import redis.asyncio as aioredis

from api.config import settings
from services.vault import vault

logger = logging.getLogger(__name__)


class GuestDestinationManager:
    """Manages FFmpeg RTMP fanout processes for stream guests."""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self._processes: dict[str, dict[str, asyncio.subprocess.Process]] = {}

    async def _get_redis(self) -> aioredis.Redis:
        if self.redis is None:
            self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        return self.redis

    def _build_ffmpeg_cmd(self, input_source: str, rtmp_url: str, stream_key: str,
                          resolution: str = "1920x1080", bitrate: int = 5000) -> list[str]:
        """Build FFmpeg command for RTMP fanout."""
        max_rate = int(bitrate * 1.2)
        buf_size = bitrate * 2
        full_url = f"{rtmp_url}/{stream_key}"

        return [
            "ffmpeg", "-re", "-i", input_source,
            "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
            "-b:v", f"{bitrate}k", "-maxrate", f"{max_rate}k", "-bufsize", f"{buf_size}k",
            "-s", resolution, "-g", "60",
            "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
            "-f", "flv", "-flvflags", "no_duration_filesize",
            full_url,
        ]

    async def start_fanout(self, guest_id: str, stream_id: str, input_source: str,
                           destinations: list[dict]) -> dict:
        """Start RTMP fanout for a guest to multiple destinations.

        Args:
            guest_id: UUID of the guest
            stream_id: UUID of the stream
            input_source: RTMP input URL for this guest
            destinations: List of {encrypted_key, platform, resolution, bitrate}

        Returns:
            Dict of platform → status
        """
        r = await self._get_redis()
        results = {}

        if guest_id not in self._processes:
            self._processes[guest_id] = {}

        for dest in destinations:
            platform = dest["platform"]
            try:
                # Unseal the encrypted stream key
                credentials = vault.unseal_stream_key(dest["encrypted_key"])
                rtmp_url = credentials["rtmp_url"]
                stream_key = credentials["stream_key"]
                resolution = dest.get("resolution", "1920x1080")
                bitrate = dest.get("bitrate", 5000)

                # Build and spawn FFmpeg process
                cmd = self._build_ffmpeg_cmd(input_source, rtmp_url, stream_key, resolution, bitrate)
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.PIPE,
                )

                self._processes[guest_id][platform] = process

                # Store state in Redis
                await r.hset(
                    f"fanout:{guest_id}",
                    platform,
                    f"{process.pid}|live|{resolution}|{bitrate}",
                )
                await r.hset(f"fanout:{guest_id}", "_stream_id", stream_id)

                # Monitor process in background
                asyncio.create_task(self._monitor_process(guest_id, platform, process))

                results[platform] = {"status": "live", "pid": process.pid}
                logger.info(f"Started fanout: guest={guest_id} platform={platform} pid={process.pid}")

            except Exception as e:
                logger.error(f"Failed to start fanout for {platform}: {e}")
                results[platform] = {"status": "error", "error": str(e)}
                await r.hset(f"fanout:{guest_id}", platform, f"0|error|{resolution}|{bitrate}")

        return results

    async def _monitor_process(self, guest_id: str, platform: str,
                                process: asyncio.subprocess.Process) -> None:
        """Monitor an FFmpeg process and update status on exit."""
        try:
            stderr = await process.communicate()
            return_code = process.returncode

            r = await self._get_redis()

            if return_code == 0:
                await r.hset(f"fanout:{guest_id}", platform, f"{process.pid}|stopped|0|0")
                logger.info(f"Fanout ended normally: guest={guest_id} platform={platform}")
            else:
                error_msg = stderr[1].decode()[-200:] if stderr[1] else "Unknown error"
                await r.hset(f"fanout:{guest_id}", platform, f"{process.pid}|error|0|0")
                logger.error(f"Fanout failed: guest={guest_id} platform={platform} rc={return_code} err={error_msg}")

            # Clean up process reference
            if guest_id in self._processes and platform in self._processes[guest_id]:
                del self._processes[guest_id][platform]

        except Exception as e:
            logger.error(f"Error monitoring process: {e}")

    async def stop_destination(self, guest_id: str, platform: str | None = None) -> dict:
        """Stop RTMP fanout for a guest.

        Args:
            guest_id: UUID of the guest
            platform: Specific platform to stop, or None for all
        """
        r = await self._get_redis()
        stopped = {}

        if platform:
            platforms = [platform]
        else:
            platforms = list(self._processes.get(guest_id, {}).keys())

        for p in platforms:
            if guest_id in self._processes and p in self._processes[guest_id]:
                proc = self._processes[guest_id][p]
                try:
                    proc.terminate()
                    try:
                        await asyncio.wait_for(proc.wait(), timeout=5.0)
                    except asyncio.TimeoutError:
                        proc.kill()
                        await proc.wait()
                    stopped[p] = "stopped"
                    logger.info(f"Stopped fanout: guest={guest_id} platform={p}")
                except ProcessLookupError:
                    stopped[p] = "already_stopped"

                del self._processes[guest_id][p]

            await r.hdel(f"fanout:{guest_id}", p)

        # Clean up empty guest entries
        if guest_id in self._processes and not self._processes[guest_id]:
            del self._processes[guest_id]
            await r.delete(f"fanout:{guest_id}")

        return stopped

    async def get_status(self, guest_id: str | None = None) -> dict:
        """Get fanout status from Redis.

        Args:
            guest_id: Specific guest, or None for all active fanouts
        """
        r = await self._get_redis()

        if guest_id:
            data = await r.hgetall(f"fanout:{guest_id}")
            if not data:
                return {}
            result = {}
            for platform, value in data.items():
                if platform.startswith("_"):
                    continue
                parts = value.split("|")
                result[platform] = {
                    "pid": int(parts[0]) if parts[0] != "0" else None,
                    "status": parts[1] if len(parts) > 1 else "unknown",
                    "resolution": parts[2] if len(parts) > 2 else "1920x1080",
                    "bitrate": int(parts[3]) if len(parts) > 3 and parts[3] != "0" else 5000,
                }
            return result

        # All active fanouts
        all_status = {}
        async for key in r.scan_iter("fanout:*"):
            gid = key.split(":", 1)[1]
            all_status[gid] = await self.get_status(gid)
        return all_status

    async def shutdown(self) -> None:
        """Terminate all FFmpeg processes on application shutdown."""
        logger.info("Shutting down all fanout processes...")
        for guest_id in list(self._processes.keys()):
            await self.stop_destination(guest_id)
        if self.redis:
            await self.redis.aclose()
        logger.info("All fanout processes terminated")


destination_manager = GuestDestinationManager()
