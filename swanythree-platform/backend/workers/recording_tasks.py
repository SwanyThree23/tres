"""SwanyThree Recording Tasks — Upload to R2, generate thumbnails."""

import logging
import os

import boto3
from botocore.config import Config

from workers.celery_app import celery_app
from api.config import settings

logger = logging.getLogger(__name__)


def get_r2_client():
    """Create Cloudflare R2 (S3-compatible) client."""
    return boto3.client(
        "s3",
        endpoint_url=settings.CLOUDFLARE_R2_ENDPOINT,
        aws_access_key_id=settings.CLOUDFLARE_R2_ACCESS_KEY,
        aws_secret_access_key=settings.CLOUDFLARE_R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def upload_recording(self, recording_id: str, file_path: str, content_type: str = "video/mp4"):
    """Upload a recording file to Cloudflare R2.

    Args:
        recording_id: UUID of the recording record
        file_path: Local path to the recording file
        content_type: MIME type of the file
    """
    try:
        if not os.path.exists(file_path):
            logger.error(f"Recording file not found: {file_path}")
            return {"error": "File not found", "recording_id": recording_id}

        client = get_r2_client()
        key = f"recordings/{recording_id}/{os.path.basename(file_path)}"

        file_size = os.path.getsize(file_path)
        logger.info(f"Uploading recording: {recording_id} size={file_size} to {key}")

        client.upload_file(
            file_path,
            settings.CLOUDFLARE_R2_BUCKET,
            key,
            ExtraArgs={"ContentType": content_type},
        )

        file_url = f"{settings.CLOUDFLARE_R2_ENDPOINT}/{settings.CLOUDFLARE_R2_BUCKET}/{key}"

        logger.info(f"Recording uploaded: {recording_id} url={file_url}")
        return {"recording_id": recording_id, "file_url": file_url, "file_size": file_size}

    except Exception as exc:
        logger.error(f"Failed to upload recording {recording_id}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=2)
def generate_thumbnail(self, recording_id: str, file_path: str, timestamp: int = 10):
    """Generate a thumbnail from a recording at a given timestamp.

    Uses FFmpeg to extract a frame and uploads to R2.
    """
    import subprocess
    import tempfile

    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            thumb_path = tmp.name

        cmd = [
            "ffmpeg", "-y", "-i", file_path,
            "-ss", str(timestamp), "-vframes", "1",
            "-vf", "scale=640:360",
            "-q:v", "2", thumb_path,
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=30)
        if result.returncode != 0:
            logger.error(f"FFmpeg thumbnail failed: {result.stderr.decode()[:200]}")
            return {"error": "Thumbnail generation failed"}

        # Upload thumbnail
        client = get_r2_client()
        key = f"thumbnails/{recording_id}.jpg"
        client.upload_file(
            thumb_path,
            settings.CLOUDFLARE_R2_BUCKET,
            key,
            ExtraArgs={"ContentType": "image/jpeg"},
        )

        os.unlink(thumb_path)

        thumb_url = f"{settings.CLOUDFLARE_R2_ENDPOINT}/{settings.CLOUDFLARE_R2_BUCKET}/{key}"
        logger.info(f"Thumbnail generated: {recording_id}")
        return {"recording_id": recording_id, "thumbnail_url": thumb_url}

    except Exception as exc:
        logger.error(f"Thumbnail generation failed for {recording_id}: {exc}")
        if os.path.exists(thumb_path):
            os.unlink(thumb_path)
        raise self.retry(exc=exc)
