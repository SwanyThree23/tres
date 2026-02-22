from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.middleware.auth import get_current_user
from services.payment import payment_service
from services.notification import notification_service
from models.entities import User, Notification
from api.database import get_db

@router.post("/tip")
async def send_tip(
    request: TipRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a PaymentIntent for tipping a creator and notify them."""
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

    # In a real app, this would be triggered by a Stripe Webhook 
    # AFTER the payment is confirmed. For this demo flow, we'll
    # trigger it immediately to show progress.
    
    # 1. Persist to DB
    new_notif = Notification(
        user_id=request.recipient_id,
        type="tip",
        title="New Tip Received!",
        body=f"{current_user.username} tipped you ${request.amount_cents/100:.2f}",
        metadata_json={"amount": request.amount_cents, "sender": current_user.username}
    )
    db.add(new_notif)
    await db.commit()

    # 2. Push via WebSocket
    await notification_service.broadcast_notification(
        request.recipient_id,
        {
            "type": "tip",
            "title": new_notif.title,
            "body": new_notif.body,
            "amount": request.amount_cents
        }
    )

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id
    }
