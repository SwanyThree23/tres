// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Stripe Client
// Payment processing: Tips, Subscriptions, Paywalls, Payouts
// 90% payout to creators, 10% platform fee
// ──────────────────────────────────────────────────────────────────────────────

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "[Stripe] No STRIPE_SECRET_KEY found — payment features disabled",
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
  typescript: true,
});

// ── Constants ───────────────────────────────────────────────────────────────

export const PLATFORM_FEE_PERCENT = 10; // 10% platform cut
export const CREATOR_PAYOUT_PERCENT = 90; // 90% to creator
export const PAYOUT_MIN_CENTS = 2000; // $20 minimum payout
export const PAYOUT_PROCESSING_HOURS = 48;

// Creator tier prices in cents
export const CREATOR_TIER_PRICES = {
  CREATOR: 1900, // $19/mo
  PRO: 4900, // $49/mo
  STUDIO: 14900, // $149/mo
} as const;

// Viewer subscription prices in cents
export const VIEWER_SUB_PRICES = {
  FAN: 500, // $5/mo
  SUPPORTER: 1000, // $10/mo
  RIDE_OR_DIE: 2000, // $20/mo
} as const;

// ── Helper Functions ────────────────────────────────────────────────────────

/**
 * Calculate platform fee and creator payout from a gross amount in cents.
 */
export function calculateSplit(amountCents: number): {
  platformFeeCents: number;
  creatorPayoutCents: number;
} {
  const platformFeeCents = Math.round(
    amountCents * (PLATFORM_FEE_PERCENT / 100),
  );
  const creatorPayoutCents = amountCents - platformFeeCents;
  return { platformFeeCents, creatorPayoutCents };
}

/**
 * Create a Stripe Connect account for a creator.
 */
export async function createConnectedAccount(
  email: string,
  displayName: string,
): Promise<Stripe.Account> {
  return stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_profile: {
      name: displayName,
      product_description: "CYLive Creator — Live Streaming Content",
    },
  });
}

/**
 * Generate an onboarding link for Stripe Connect.
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<Stripe.AccountLink> {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

/**
 * Transfer funds to a creator's connected account (tip, sub, paywall revenue).
 * Automatically applies the 90/10 split.
 */
export async function transferToCreator(
  amountCents: number,
  connectedAccountId: string,
  description: string,
): Promise<Stripe.Transfer> {
  const { creatorPayoutCents } = calculateSplit(amountCents);

  return stripe.transfers.create({
    amount: creatorPayoutCents,
    currency: "usd",
    destination: connectedAccountId,
    description,
  });
}

/**
 * Create a payment intent for a tip or paywall access.
 */
export async function createPaymentIntent(
  amountCents: number,
  customerId: string,
  connectedAccountId: string,
  metadata: Record<string, string>,
): Promise<Stripe.PaymentIntent> {
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

/**
 * Create a subscription for a viewer to a creator.
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  connectedAccountId: string,
  metadata: Record<string, string>,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    application_fee_percent: PLATFORM_FEE_PERCENT,
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata,
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });
}

/**
 * Create a Stripe Customer for a new user.
 */
export async function createCustomer(
  email: string,
  name: string,
): Promise<Stripe.Customer> {
  return stripe.customers.create({ email, name });
}

export default stripe;
