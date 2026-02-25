// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Stripe Client Configuration
// Stripe Connect (90/10 split), Payment Intents, Subscriptions
// ──────────────────────────────────────────────────────────────────────────────

import Stripe from "stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10" as any,
  typescript: true,
});

// ── CYLive Fee Constants ────────────────────────────────────────────────────

/** Creator takes 90% of all payments */
export const CREATOR_PAYOUT_PERCENT = 90;

/** Platform takes 10% commission */
export const PLATFORM_FEE_PERCENT = 10;

/** Viewer Subscription Tiers (monthly, in cents) */
export const VIEWER_SUB_PRICES: Record<string, number> = {
  FAN: 500, // $5/month
  SUPPORTER: 1000, // $10/month
  RIDE_OR_DIE: 2000, // $20/month
};

/** Creator Service Tiers (monthly, in cents) */
export const CREATOR_TIER_PRICES: Record<string, number> = {
  FREE: 0,
  CREATOR: 999, // $9.99/month
  PRO: 2999, // $29.99/month
  STUDIO: 9999, // $99.99/month
};

// ── Helper Functions ────────────────────────────────────────────────────────

/** Calculate the 90/10 split for a given amount */
export function calculateSplit(amountCents: number) {
  const platformFeeCents = Math.round(
    amountCents * (PLATFORM_FEE_PERCENT / 100),
  );
  const creatorPayoutCents = amountCents - platformFeeCents;
  return { platformFeeCents, creatorPayoutCents };
}

/** Create a Stripe Customer for a new user */
export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({
    email,
    name,
    metadata: { platform: "cylive" },
  });
}

/** Create a Stripe Connected Account for a creator */
export async function createConnectedAccount(email: string, userId: string) {
  return stripe.accounts.create({
    type: "express",
    email,
    metadata: { userId, platform: "cylive" },
    capabilities: {
      transfers: { requested: true },
    },
  });
}

/** Create a Payment Intent with Platform Fee */
export async function createPaymentIntent(
  amountCents: number,
  customerId: string,
  connectedAccountId: string,
  metadata: Record<string, string>,
) {
  const { platformFeeCents } = calculateSplit(amountCents);

  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    application_fee_amount: platformFeeCents,
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata,
  });
}

/** Transfer earnings to creator's connected account */
export async function transferToCreator(
  amountCents: number,
  connectedAccountId: string,
  metadata: Record<string, string>,
) {
  return stripe.transfers.create({
    amount: amountCents,
    currency: "usd",
    destination: connectedAccountId,
    metadata,
  });
}

/** Create an account onboarding link */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
) {
  return stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });
}

/** Get account balance for a connected account */
export async function getAccountBalance(connectedAccountId: string) {
  return stripe.balance.retrieve({
    stripeAccount: connectedAccountId,
  });
}

export default stripe;
