import stripe
import logging
from api.config import settings
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    """Service to handle Stripe payments, Connect accounts, and payouts."""

    def __init__(self):
        self.platform_fee_percent = settings.PLATFORM_FEE_PERCENT

    async def create_connect_account(self, email: str, username: str) -> Optional[str]:
        """Create a Stripe Express Connect account for a creator."""
        try:
            account = stripe.Account.create(
                type="express",
                email=email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_profile={"url": f"https://swanythree.com/{username}"},
            )
            return account.id
        except Exception as e:
            logger.error(f"Failed to create Stripe Connect account: {e}")
            return None

    async def create_account_link(self, account_id: str) -> Optional[str]:
        """Generate an onboarding link for the Connect account."""
        try:
            account_link = stripe.AccountLink.create(
                account=account_id,
                refresh_url="https://swanythree.com/onboarding/refresh",
                return_url="https://swanythree.com/onboarding/complete",
                type="account_onboarding",
            )
            return account_link.url
        except Exception as e:
            logger.error(f"Failed to create Stripe Account Link: {e}")
            return None

    async def create_payment_intent(
        self, 
        amount_cents: int, 
        currency: str = "usd", 
        metadata: Dict[str, Any] = None
    ) -> Optional[stripe.PaymentIntent]:
        """Create a PaymentIntent for a donation or subscription."""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={"enabled": True},
            )
            return intent
        except Exception as e:
            logger.error(f"Failed to create PaymentIntent: {e}")
            return None

    async def process_payout(self, connect_id: str, amount_cents: int) -> bool:
        """Transfer funds to a creator's Connect account (minus platform fee)."""
        try:
            # Note: In production, we'd typically use 'destination' in PaymentIntent 
            # or separate Transfer objects for manual payouts.
            stripe.Transfer.create(
                amount=amount_cents,
                currency="usd",
                destination=connect_id,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to process payout/transfer: {e}")
            return False

payment_service = PaymentService()
