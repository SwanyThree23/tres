import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from ...core.config import get_settings
from ...core.database import get_db
from ...core.deps import get_current_user
from ...models.entities import User, Stream, Transaction

settings = get_settings()
router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = settings.stripe_secret_key

PLATFORM_FEE_PCT = 0.10


def _split(amount_cents: int) -> tuple[int, int]:
    """Return (creator_cents, platform_cents) after Stripe processing fee."""
    stripe_fee = round(amount_cents * 0.029 + 30)
    net = amount_cents - stripe_fee
    platform = round(net * PLATFORM_FEE_PCT)
    creator = net - platform
    return creator, platform


# ── Schemas ───────────────────────────────────────────────────────────────────

class TipRequest(BaseModel):
    stream_id: str
    amount_cents: int  # e.g. 500 = $5.00
    message: str = ""


class TipResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount_cents: int
    creator_cents: int
    platform_cents: int


class SubscribeRequest(BaseModel):
    creator_id: str
    price_id: str  # Stripe Price ID for the subscription tier


# ── Tips ─────────────────────────────────────────────────────────────────────

@router.post("/tip", response_model=TipResponse)
async def create_tip(
    body: TipRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.amount_cents < 50:
        raise HTTPException(status_code=400, detail="Minimum tip is $0.50")
    if body.amount_cents > 100_000:
        raise HTTPException(status_code=400, detail="Maximum tip is $1,000")

    result = await db.execute(
        select(Stream).where(Stream.id == body.stream_id)
    )
    stream = result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    creator_cents, platform_cents = _split(body.amount_cents)

    if not settings.stripe_secret_key:
        # Sandbox mode — return a fake intent
        return TipResponse(
            client_secret="pi_sandbox_secret",
            payment_intent_id="pi_sandbox",
            amount_cents=body.amount_cents,
            creator_cents=creator_cents,
            platform_cents=platform_cents,
        )

    try:
        intent = stripe.PaymentIntent.create(
            amount=body.amount_cents,
            currency="usd",
            metadata={
                "stream_id": body.stream_id,
                "sender_id": current_user.id,
                "recipient_id": stream.creator_id,
                "message": body.message[:200],
                "type": "tip",
            },
            description=f"Tip for stream: {stream.title[:80]}",
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message}")

    return TipResponse(
        client_secret=intent.client_secret,
        payment_intent_id=intent.id,
        amount_cents=body.amount_cents,
        creator_cents=creator_cents,
        platform_cents=platform_cents,
    )


@router.get("/transactions")
async def list_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.recipient_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    txns = result.scalars().all()
    return [
        {
            "id": t.id,
            "amount": t.amount,
            "creator_amount": t.creator_amount,
            "platform_amount": t.platform_amount,
            "type": t.type,
            "stream_id": t.stream_id,
            "created_at": t.created_at.isoformat(),
        }
        for t in txns
    ]


# ── Stripe Webhook ────────────────────────────────────────────────────────────

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    if not settings.stripe_webhook_secret:
        return {"received": True}

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        meta = pi.get("metadata", {})
        if meta.get("type") == "tip":
            amount = pi["amount"]
            creator_cents, platform_cents = _split(amount)
            txn = Transaction(
                stream_id=meta.get("stream_id"),
                sender_id=meta["sender_id"],
                recipient_id=meta["recipient_id"],
                amount=amount / 100,
                creator_amount=creator_cents / 100,
                platform_amount=platform_cents / 100,
                type="tip",
                stripe_payment_intent=pi["id"],
            )
            db.add(txn)
            await db.commit()

    return {"received": True}
