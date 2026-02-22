from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.middleware.auth import get_current_user
from api.services.payment import payment_service
from models.entities import User
from pydantic import BaseModel

router = APIRouter()

class SetupConnectResponse(BaseModel):
    account_id: str
    onboarding_url: str

@router.post("/setup-connect", response_model=SetupConnectResponse)
async def setup_stripe_connect(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe Connect account and generate an onboarding link."""
    if current_user.stripe_connect_id:
        # Account already exists, just get a new link
        account_id = current_user.stripe_connect_id
    else:
        account_id = await payment_service.create_connect_account(
            email=current_user.email,
            username=current_user.username
        )
        if not account_id:
            raise HTTPException(status_code=500, detail="Failed to create Stripe account")
        
        current_user.stripe_connect_id = account_id
        await db.commit()

    onboarding_url = await payment_service.create_account_link(account_id)
    if not onboarding_url:
        raise HTTPException(status_code=500, detail="Failed to generate onboarding link")

    return {
        "account_id": account_id,
        "onboarding_url": onboarding_url
    }

class TipRequest(BaseModel):
    recipient_id: str
    amount_cents: int
    message: str | None = None

@router.post("/tip")
async def send_tip(
    request: TipRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a PaymentIntent for tipping a creator."""
    intent = await payment_service.create_payment_intent(
        amount_cents=request.amount_cents,
        metadata={
            "sender_id": str(current_user.id),
            "recipient_id": request.recipient_id,
            "type": "tip"
        }
    )
    if not intent:
        raise HTTPException(status_code=500, detail="Failed to create payment")

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id
    }
