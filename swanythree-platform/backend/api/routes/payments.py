"""SwanyThree Payment Routes — tips, paywall access, fees, revenue, webhooks."""

import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.database import get_db
from api.dependencies import Pagination, get_pagination
from api.middleware.auth import get_current_user
from models.entities import (
    Notification,
    NotificationType,
    Stream,
    StreamStatus,
    Transaction,
    TransactionStatus,
    TransactionType,
    User,
    UserGamification,
    XPAction,
    XPHistory,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["Payments"])

PROCESSOR_FEE_RATE = 0.029
PROCESSOR_FEE_FIXED_CENTS = 30
MIN_TIP_CENTS = 100
XP_DONATE = 25


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class TipRequest(BaseModel):
    recipient_id: UUID
    amount_cents: int = Field(..., ge=MIN_TIP_CENTS, description="Amount in cents (min 100)")
    stream_id: UUID | None = None
    message: str | None = Field(None, max_length=500)
    stripe_payment_intent_id: str | None = None


class PaywallAccessRequest(BaseModel):
    stream_id: UUID
    amount_cents: int = Field(..., ge=100)
    stripe_payment_intent_id: str | None = None


class FeeCalcRequest(BaseModel):
    amount_cents: int = Field(..., ge=100)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def calculate_fees(amount_cents: int) -> dict:
    """Calculate the fee breakdown for a given amount in cents.

    Returns amounts in dollars (float).
    """
    amount_dollars = amount_cents / 100.0
    processor_fee_dollars = round(amount_cents * PROCESSOR_FEE_RATE + PROCESSOR_FEE_FIXED_CENTS, 2) / 100.0
    platform_fee_dollars = round(amount_dollars * settings.PLATFORM_FEE_PERCENT, 2)
    creator_amount = round(amount_dollars - processor_fee_dollars - platform_fee_dollars, 2)

    return {
        "amount": amount_dollars,
        "processor_fee": processor_fee_dollars,
        "platform_fee": platform_fee_dollars,
        "creator_receives": max(creator_amount, 0.0),
        "currency": "USD",
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/tip", status_code=201)
async def send_tip(
    req: TipRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a tip transaction. Amount is in cents, minimum 100 ($1.00)."""
    if req.recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot tip yourself")

    recipient_result = await db.execute(select(User).where(User.id == req.recipient_id))
    recipient = recipient_result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    fees = calculate_fees(req.amount_cents)

    transaction = Transaction(
        user_id=current_user.id,
        recipient_id=req.recipient_id,
        type=TransactionType.tip,
        status=TransactionStatus.completed,
        amount=fees["amount"],
        currency="USD",
        platform_fee=fees["platform_fee"],
        stripe_payment_intent_id=req.stripe_payment_intent_id,
        metadata_json={
            "processor_fee": fees["processor_fee"],
            "creator_receives": fees["creator_receives"],
            "stream_id": str(req.stream_id) if req.stream_id else None,
            "message": req.message,
        },
    )
    db.add(transaction)

    notification = Notification(
        user_id=req.recipient_id,
        type=NotificationType.donation,
        title="New Tip Received!",
        body=f"{current_user.display_name or current_user.username} tipped you ${fees['amount']:.2f}"
             + (f": {req.message}" if req.message else ""),
        action_url=f"/payments/transactions",
        metadata_json={
            "sender_id": str(current_user.id),
            "amount": fees["amount"],
            "transaction_id": None,
        },
    )
    db.add(notification)

    gam_result = await db.execute(
        select(UserGamification).where(UserGamification.user_id == current_user.id)
    )
    gamification = gam_result.scalar_one_or_none()
    if gamification:
        gamification.xp_total += XP_DONATE
        xp_entry = XPHistory(
            user_id=current_user.id,
            action=XPAction.donate,
            xp_amount=XP_DONATE,
            metadata_json={"recipient_id": str(req.recipient_id), "amount": fees["amount"]},
        )
        db.add(xp_entry)

    await db.commit()
    await db.refresh(transaction)

    logger.info(
        "Tip: %s -> %s for $%.2f",
        current_user.username, recipient.username, fees["amount"],
    )

    return {
        "success": True,
        "transaction": {
            "id": str(transaction.id),
            "type": "tip",
            "status": "completed",
            "amount": fees["amount"],
            "processor_fee": fees["processor_fee"],
            "platform_fee": fees["platform_fee"],
            "creator_receives": fees["creator_receives"],
            "currency": "USD",
            "created_at": transaction.created_at.isoformat() if transaction.created_at else "",
        },
    }


@router.post("/paywall-access", status_code=201)
async def purchase_paywall_access(
    req: PaywallAccessRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Purchase access to a paywalled stream."""
    stream_result = await db.execute(select(Stream).where(Stream.id == req.stream_id))
    stream = stream_result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    if stream.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Stream owner has automatic access")

    existing = await db.execute(
        select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.type == TransactionType.subscription,
            Transaction.status == TransactionStatus.completed,
            Transaction.metadata_json["stream_id"].astext == str(req.stream_id),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already purchased access to this stream")

    fees = calculate_fees(req.amount_cents)

    transaction = Transaction(
        user_id=current_user.id,
        recipient_id=stream.user_id,
        type=TransactionType.subscription,
        status=TransactionStatus.completed,
        amount=fees["amount"],
        currency="USD",
        platform_fee=fees["platform_fee"],
        stripe_payment_intent_id=req.stripe_payment_intent_id,
        metadata_json={
            "stream_id": str(req.stream_id),
            "processor_fee": fees["processor_fee"],
            "creator_receives": fees["creator_receives"],
            "access_type": "paywall",
        },
    )
    db.add(transaction)

    notification = Notification(
        user_id=stream.user_id,
        type=NotificationType.donation,
        title="Paywall Purchase",
        body=f"{current_user.display_name or current_user.username} purchased access to '{stream.title}' for ${fees['amount']:.2f}",
        action_url=f"/streams/{stream.id}",
    )
    db.add(notification)

    await db.commit()
    await db.refresh(transaction)

    return {
        "success": True,
        "transaction": {
            "id": str(transaction.id),
            "type": "subscription",
            "status": "completed",
            "amount": fees["amount"],
            "stream_id": str(req.stream_id),
            "created_at": transaction.created_at.isoformat() if transaction.created_at else "",
        },
        "access_granted": True,
    }


@router.get("/calculate-fees")
async def get_fee_breakdown(amount_cents: int = Query(..., ge=100)):
    """Preview the fee breakdown for a given amount in cents."""
    fees = calculate_fees(amount_cents)
    return {"success": True, "fees": fees}


@router.get("/revenue")
async def get_revenue_report(
    period: str = Query(default="month", pattern=r"^(day|week|month|year|all)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revenue report for the current user by time period."""
    now = datetime.now(timezone.utc)
    period_map = {
        "day": now - timedelta(days=1),
        "week": now - timedelta(weeks=1),
        "month": now - timedelta(days=30),
        "year": now - timedelta(days=365),
        "all": datetime(2000, 1, 1, tzinfo=timezone.utc),
    }
    since = period_map[period]

    base_filter = and_(
        Transaction.recipient_id == current_user.id,
        Transaction.status == TransactionStatus.completed,
        Transaction.created_at >= since,
    )

    total_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(base_filter)
    )
    total_revenue = float(total_result.scalar() or 0.0)

    fees_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.platform_fee), 0.0)).where(base_filter)
    )
    total_fees = float(fees_result.scalar() or 0.0)

    count_result = await db.execute(
        select(func.count()).where(base_filter)
    )
    transaction_count = count_result.scalar() or 0

    tips_filter = and_(base_filter, Transaction.type == TransactionType.tip)
    tips_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(tips_filter)
    )
    tips_total = float(tips_result.scalar() or 0.0)

    paywall_filter = and_(base_filter, Transaction.type == TransactionType.subscription)
    paywall_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(paywall_filter)
    )
    paywall_total = float(paywall_result.scalar() or 0.0)

    net_revenue = round(total_revenue - total_fees, 2)

    return {
        "success": True,
        "revenue": {
            "period": period,
            "total_revenue": round(total_revenue, 2),
            "total_fees": round(total_fees, 2),
            "net_revenue": net_revenue,
            "transaction_count": transaction_count,
            "breakdown": {
                "tips": round(tips_total, 2),
                "paywall": round(paywall_total, 2),
            },
            "currency": "USD",
        },
    }


@router.get("/transactions")
async def list_transactions(
    type_filter: str | None = Query(None, alias="type"),
    status_filter: str | None = Query(None, alias="status"),
    pagination: Pagination = Depends(get_pagination),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Paginated transaction history for the current user (sent and received)."""
    from sqlalchemy import or_

    query = select(Transaction).where(
        or_(
            Transaction.user_id == current_user.id,
            Transaction.recipient_id == current_user.id,
        )
    )

    if type_filter:
        try:
            tx_type = TransactionType(type_filter)
            query = query.where(Transaction.type == tx_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid type: {type_filter}")

    if status_filter:
        try:
            tx_status = TransactionStatus(status_filter)
            query = query.where(Transaction.status == tx_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_filter}")

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        query.order_by(Transaction.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    transactions = result.scalars().all()

    items = []
    for tx in transactions:
        direction = "sent" if tx.user_id == current_user.id else "received"
        items.append({
            "id": str(tx.id),
            "type": tx.type.value if hasattr(tx.type, "value") else str(tx.type),
            "status": tx.status.value if hasattr(tx.status, "value") else str(tx.status),
            "amount": tx.amount,
            "currency": tx.currency,
            "platform_fee": tx.platform_fee,
            "direction": direction,
            "user_id": str(tx.user_id),
            "recipient_id": str(tx.recipient_id) if tx.recipient_id else None,
            "stripe_payment_intent_id": tx.stripe_payment_intent_id,
            "metadata": tx.metadata_json,
            "created_at": tx.created_at.isoformat() if tx.created_at else "",
        })

    return {
        "success": True,
        "transactions": items,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Stripe webhook handler with signature verification."""
    body = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe signature header")

    # Parse the Stripe signature header
    elements = {}
    for item in sig_header.split(","):
        key_val = item.strip().split("=", 1)
        if len(key_val) == 2:
            elements.setdefault(key_val[0], []).append(key_val[1])

    timestamp = elements.get("t", [None])[0]
    signatures = elements.get("v1", [])

    if not timestamp or not signatures:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature format")

    # Verify signature
    signed_payload = f"{timestamp}.{body.decode('utf-8')}"
    expected_sig = hmac.new(
        settings.STRIPE_WEBHOOK_SECRET.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not any(hmac.compare_digest(expected_sig, sig) for sig in signatures):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("type", "")
    event_data = event.get("data", {}).get("object", {})

    if event_type == "payment_intent.succeeded":
        payment_intent_id = event_data.get("id")
        if payment_intent_id:
            result = await db.execute(
                select(Transaction).where(
                    Transaction.stripe_payment_intent_id == payment_intent_id,
                    Transaction.status == TransactionStatus.pending,
                )
            )
            tx = result.scalar_one_or_none()
            if tx:
                tx.status = TransactionStatus.completed
                await db.commit()
                logger.info("Payment intent succeeded: %s", payment_intent_id)

    elif event_type == "payment_intent.payment_failed":
        payment_intent_id = event_data.get("id")
        if payment_intent_id:
            result = await db.execute(
                select(Transaction).where(
                    Transaction.stripe_payment_intent_id == payment_intent_id,
                    Transaction.status == TransactionStatus.pending,
                )
            )
            tx = result.scalar_one_or_none()
            if tx:
                tx.status = TransactionStatus.failed
                await db.commit()
                logger.warning("Payment intent failed: %s", payment_intent_id)

    elif event_type == "charge.refunded":
        payment_intent_id = event_data.get("payment_intent")
        if payment_intent_id:
            result = await db.execute(
                select(Transaction).where(
                    Transaction.stripe_payment_intent_id == payment_intent_id,
                    Transaction.status == TransactionStatus.completed,
                )
            )
            tx = result.scalar_one_or_none()
            if tx:
                tx.status = TransactionStatus.refunded
                refund_tx = Transaction(
                    user_id=tx.recipient_id or tx.user_id,
                    recipient_id=tx.user_id,
                    type=TransactionType.refund,
                    status=TransactionStatus.completed,
                    amount=tx.amount,
                    currency=tx.currency,
                    platform_fee=0.0,
                    metadata_json={"original_transaction_id": str(tx.id)},
                )
                db.add(refund_tx)
                await db.commit()
                logger.info("Charge refunded for PI: %s", payment_intent_id)

    else:
        logger.info("Unhandled webhook event type: %s", event_type)

    return {"success": True, "event_type": event_type}
