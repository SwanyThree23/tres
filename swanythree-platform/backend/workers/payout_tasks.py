"""SwanyThree Payout Tasks — Stripe Connect payouts and XP resets."""

import logging
from datetime import datetime, timedelta, timezone

import stripe

from workers.celery_app import celery_app
from api.config import settings

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


@celery_app.task(bind=True, max_retries=3, default_retry_delay=300)
def process_pending_payouts(self):
    """Process pending payouts via Stripe Connect.

    Runs weekly. Aggregates completed transactions, creates Stripe transfers.
    """
    logger.info("Starting weekly payout processing...")

    try:
        # This would use async DB in production — simplified for Celery sync context
        import asyncio
        from sqlalchemy import create_engine, text

        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
        engine = create_engine(sync_url)

        with engine.connect() as conn:
            # Find creators with pending payouts
            result = conn.execute(text("""
                SELECT
                    u.id as user_id,
                    u.stripe_connect_id,
                    SUM(t.net_amount) as total_amount,
                    COUNT(t.id) as transaction_count
                FROM transactions t
                JOIN users u ON u.id = t.recipient_id
                WHERE t.status = 'completed'
                  AND t.type IN ('tip', 'paywall', 'subscription')
                  AND t.created_at > NOW() - INTERVAL '7 days'
                  AND u.stripe_connect_id IS NOT NULL
                GROUP BY u.id, u.stripe_connect_id
                HAVING SUM(t.net_amount) >= 10.00
            """))

            payouts_processed = 0
            for row in result:
                try:
                    amount_cents = int(row.total_amount * 100)

                    transfer = stripe.Transfer.create(
                        amount=amount_cents,
                        currency="usd",
                        destination=row.stripe_connect_id,
                        description=f"SwanyThree weekly payout - {row.transaction_count} transactions",
                    )

                    # Record payout
                    conn.execute(text("""
                        INSERT INTO payouts (user_id, amount, status, stripe_payout_id,
                                           period_start, period_end, transaction_count, processed_at)
                        VALUES (:user_id, :amount, 'completed', :stripe_id,
                                NOW() - INTERVAL '7 days', NOW(), :count, NOW())
                    """), {
                        "user_id": str(row.user_id),
                        "amount": float(row.total_amount),
                        "stripe_id": transfer.id,
                        "count": row.transaction_count,
                    })

                    payouts_processed += 1
                    logger.info(f"Payout processed: user={row.user_id} amount=${row.total_amount:.2f}")

                except stripe.error.StripeError as e:
                    logger.error(f"Stripe payout failed for user {row.user_id}: {e}")
                    conn.execute(text("""
                        INSERT INTO payouts (user_id, amount, status, period_start, period_end, transaction_count)
                        VALUES (:user_id, :amount, 'failed', NOW() - INTERVAL '7 days', NOW(), :count)
                    """), {
                        "user_id": str(row.user_id),
                        "amount": float(row.total_amount),
                        "count": row.transaction_count,
                    })

            conn.commit()

        engine.dispose()
        logger.info(f"Payout processing complete: {payouts_processed} payouts")
        return {"payouts_processed": payouts_processed}

    except Exception as exc:
        logger.error(f"Payout processing failed: {exc}")
        raise self.retry(exc=exc)


@celery_app.task
def reset_weekly_xp():
    """Reset weekly XP counters for all users. Runs every Monday."""
    logger.info("Resetting weekly XP counters...")
    try:
        from sqlalchemy import create_engine, text
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
        engine = create_engine(sync_url)

        with engine.connect() as conn:
            result = conn.execute(text("UPDATE user_gamification SET weekly_xp = 0"))
            conn.commit()
            logger.info(f"Weekly XP reset for {result.rowcount} users")

        engine.dispose()
    except Exception as e:
        logger.error(f"Weekly XP reset failed: {e}")


@celery_app.task
def reset_monthly_xp():
    """Reset monthly XP counters for all users. Runs 1st of each month."""
    logger.info("Resetting monthly XP counters...")
    try:
        from sqlalchemy import create_engine, text
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
        engine = create_engine(sync_url)

        with engine.connect() as conn:
            result = conn.execute(text("UPDATE user_gamification SET monthly_xp = 0"))
            conn.commit()
            logger.info(f"Monthly XP reset for {result.rowcount} users")

        engine.dispose()
    except Exception as e:
        logger.error(f"Monthly XP reset failed: {e}")
