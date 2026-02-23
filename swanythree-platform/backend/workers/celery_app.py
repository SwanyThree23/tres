"""SwanyThree Celery Configuration — Background task processing."""

from celery import Celery
from celery.schedules import crontab

from api.config import settings

celery_app = Celery(
    "swanythree",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
    include=[
        "workers.recording_tasks",
        "workers.payout_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=300,
    task_time_limit=600,
)

# Periodic tasks
celery_app.conf.beat_schedule = {
    "process-weekly-payouts": {
        "task": "workers.payout_tasks.process_pending_payouts",
        "schedule": crontab(hour=0, minute=0, day_of_week=1),  # Every Monday midnight
    },
    "reset-weekly-xp": {
        "task": "workers.payout_tasks.reset_weekly_xp",
        "schedule": crontab(hour=0, minute=0, day_of_week=1),
    },
    "reset-monthly-xp": {
        "task": "workers.payout_tasks.reset_monthly_xp",
        "schedule": crontab(hour=0, minute=0, day_of_month=1),
    },
}
