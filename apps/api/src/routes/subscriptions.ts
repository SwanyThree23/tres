// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Subscriptions Routes  |  Fixed Tier Amounts
// ─────────────────────────────────────────────────────────────────────────────
// Tier amounts are FIXED. Never accept amount from client.
// bronze: $1.00, silver: $5.00, gold: $15.00
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { stripe, ensureStripeCustomer, computeFeeSplit } from '../services/stripe.js';
import { processTransaction } from '../services/transactions.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { SubscriptionTier } from '@prisma/client';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// FIXED TIER AMOUNTS — NEVER ACCEPT AMOUNT FROM CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const tierAmounts = {
  BRONZE: 1.00,
  SILVER: 5.00,
  GOLD: 15.00,
} as const;
// ─────────────────────────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  creatorId: z.string().uuid(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD']),
  // NOTE: No amount field. Amount is ALWAYS looked up from tierAmounts.
});

// ── Subscribe ────────────────────────────────────────────────────────────────

router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
  const data = subscribeSchema.parse(req.body);

  // Look up the amount — NEVER from client
  const amount = tierAmounts[data.tier];
  const amountCents = Math.round(amount * 100);

  if (data.creatorId === req.user!.sub) {
    throw new AppError(400, 'Cannot subscribe to yourself');
  }

  // Check existing subscription
  const existing = await prisma.subscription.findUnique({
    where: {
      subscriberId_creatorId: {
        subscriberId: req.user!.sub,
        creatorId: data.creatorId,
      },
    },
  });
  if (existing && existing.status === 'active') {
    throw new AppError(409, 'Already subscribed to this creator');
  }

  // Verify creator exists and has Stripe
  const creator = await prisma.user.findUnique({ where: { id: data.creatorId } });
  if (!creator?.stripeAccountId || !creator.chargesEnabled) {
    throw new AppError(400, 'Creator has not set up payments');
  }

  // Ensure subscriber has a Stripe customer
  const customerId = await ensureStripeCustomer(req.user!.sub);

  // Create Stripe subscription with destination charges
  const { platformFee } = computeFeeSplit(amountCents);

  // Create a product + price for this creator's tier (or reuse)
  const productName = `CY Live Sub: ${creator.displayName ?? creator.username} - ${data.tier}`;

  const product = await stripe.products.create({
    name: productName,
    metadata: { creatorId: data.creatorId, tier: data.tier },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    application_fee_percent: 10, // Exactly 10%
    transfer_data: { destination: creator.stripeAccountId },
    metadata: {
      creatorId: data.creatorId,
      subscriberId: req.user!.sub,
      tier: data.tier,
    },
  });

  // Create local record
  const sub = await prisma.subscription.create({
    data: {
      tier: data.tier as SubscriptionTier,
      status: 'active',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      subscriberId: req.user!.sub,
      creatorId: data.creatorId,
    },
  });

  res.status(201).json(sub);
});

// ── Cancel Subscription ─────────────────────────────────────────────────────

router.delete('/:creatorId', requireAuth, async (req: Request, res: Response) => {
  const sub = await prisma.subscription.findUnique({
    where: {
      subscriberId_creatorId: {
        subscriberId: req.user!.sub,
        creatorId: req.params.creatorId,
      },
    },
  });

  if (!sub) throw new AppError(404, 'Subscription not found');

  // Cancel at period end in Stripe
  if (sub.stripeSubscriptionId) {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });

  res.json({ success: true, message: 'Subscription will cancel at period end' });
});

// ── My Active Subscriptions (subscriber view) ──────────────────────────────

router.get('/my', requireAuth, async (req: Request, res: Response) => {
  const subs = await prisma.subscription.findMany({
    where: { subscriberId: req.user!.sub, status: 'active' },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(subs);
});

// ── My Subscribers (creator view) ──────────────────────────────────────────

router.get('/subscribers', requireAuth, requireRole('CREATOR', 'ADMIN'), async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const [subs, total] = await Promise.all([
    prisma.subscription.findMany({
      where: { creatorId: req.user!.sub, status: 'active' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        subscriber: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subscription.count({
      where: { creatorId: req.user!.sub, status: 'active' },
    }),
  ]);

  res.json({ subscribers: subs, total, page, limit, pages: Math.ceil(total / limit) });
});

export default router;
