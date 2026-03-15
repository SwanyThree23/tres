// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Stripe Service  |  Destination Charges · 90/10 Split
// ─────────────────────────────────────────────────────────────────────────────
// IMMUTABLE: Platform fee = 10%. Creator keeps 90%.
// This file NEVER reads fee values from client input.
// If you write code that makes this adjustable, DELETE IT.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  typescript: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// IMMUTABLE FEE RATE — DO NOT CHANGE — DO NOT MAKE CONFIGURABLE
// ─────────────────────────────────────────────────────────────────────────────
const PLATFORM_FEE_RATE = 0.10 as const;
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute fee split. Never configurable. Never from client.
 */
export function computeFeeSplit(grossAmountCents: number) {
  const platformFee = Math.round(grossAmountCents * PLATFORM_FEE_RATE);
  const creatorAmount = grossAmountCents - platformFee;
  return { platformFee, creatorAmount };
}

/**
 * Create Connect onboarding link for a creator
 */
export async function createConnectAccount(userId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.FRONTEND_URL}/creator/onboarding?refresh=true`,
    return_url: `${process.env.FRONTEND_URL}/creator/onboarding?success=true`,
    type: 'account_onboarding',
  });

  return { accountId: account.id, url: link.url };
}

/**
 * Get Connect account onboarding link (for returning users)
 */
export async function getConnectLoginLink(stripeAccountId: string) {
  const link = await stripe.accounts.createLoginLink(stripeAccountId);
  return link.url;
}

/**
 * Create a destination charge (super chat, tip, etc.)
 * Platform fee is ALWAYS exactly 10% — computed server-side only.
 */
export async function createDestinationCharge(opts: {
  grossAmountCents: number; // Amount in cents
  currency?: string;
  creatorStripeAccountId: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
}) {
  const { platformFee } = computeFeeSplit(opts.grossAmountCents);

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: opts.grossAmountCents,
      currency: opts.currency ?? 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: opts.creatorStripeAccountId,
      },
      metadata: opts.metadata,
    },
    { idempotencyKey: opts.idempotencyKey },
  );

  logger.info(
    {
      piId: paymentIntent.id,
      amount: opts.grossAmountCents,
      platformFee,
      creator: opts.creatorStripeAccountId,
    },
    'Destination charge created',
  );

  return paymentIntent;
}

/**
 * Create Stripe customer for a user (for subscriptions)
 */
export async function ensureStripeCustomer(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
