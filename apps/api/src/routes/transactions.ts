// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Transactions Routes  |  90/10 Fee Enforcement
// ─────────────────────────────────────────────────────────────────────────────
// POST /create — NEVER accepts platformFee or creatorAmount from client body
// GET /my — payer + recipient paginated
// GET /earnings — total, week, month by type
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { processTransaction } from '../services/transactions.js';
import { createDestinationCharge, computeFeeSplit } from '../services/stripe.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────
// NOTE: No platformFee or creatorAmount fields. EVER.
const createTransactionSchema = z.object({
  grossAmount: z.number().positive().max(10000),
  toUserId: z.string().uuid(),
  type: z.enum(['SUPER_CHAT', 'TIP', 'PRODUCT_SALE']),
  stageId: z.string().uuid().optional(),
  message: z.string().max(500).optional(),
});

// ── Create Transaction ──────────────────────────────────────────────────────

router.post('/create', requireAuth, async (req: Request, res: Response) => {
  const data = createTransactionSchema.parse(req.body);

  // Verify creator exists and has Stripe connected
  const creator = await prisma.user.findUnique({ where: { id: data.toUserId } });
  if (!creator) throw new AppError(404, 'Creator not found');
  if (!creator.stripeAccountId || !creator.chargesEnabled) {
    throw new AppError(400, 'Creator has not set up payments');
  }

  // Can't send to yourself
  if (data.toUserId === req.user!.sub) {
    throw new AppError(400, 'Cannot send to yourself');
  }

  const idempotencyKey = uuidv4();
  const grossCents = Math.round(data.grossAmount * 100);

  // Create Stripe destination charge with 10% application fee
  const paymentIntent = await createDestinationCharge({
    grossAmountCents: grossCents,
    creatorStripeAccountId: creator.stripeAccountId,
    idempotencyKey,
    metadata: {
      type: data.type,
      fromUserId: req.user!.sub,
      toUserId: data.toUserId,
      stageId: data.stageId ?? '',
    },
  });

  // Process transaction through service (Layer 1 fee enforcement)
  const transaction = await processTransaction({
    grossAmount: data.grossAmount,
    toUserId: data.toUserId,
    type: data.type as any,
    idempotencyKey,
    fromUserId: req.user!.sub,
    stageId: data.stageId,
    stripePaymentIntentId: paymentIntent.id,
    metadata: { message: data.message },
  });

  res.status(201).json({
    transaction: {
      id: transaction.id,
      type: transaction.type,
      grossAmount: transaction.grossAmount,
      status: transaction.status,
    },
    clientSecret: paymentIntent.client_secret,
  });
});

// ── My Transactions (as payer + recipient) ──────────────────────────────────

router.get('/my', requireAuth, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const role = req.query.role as string; // 'payer' | 'recipient' | undefined (both)

  const where: any = {};
  if (role === 'payer') {
    where.fromUserId = req.user!.sub;
  } else if (role === 'recipient') {
    where.toUserId = req.user!.sub;
  } else {
    where.OR = [{ fromUserId: req.user!.sub }, { toUserId: req.user!.sub }];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, username: true, displayName: true } },
        toUser: { select: { id: true, username: true, displayName: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ transactions, total, page, limit, pages: Math.ceil(total / limit) });
});

// ── Earnings (creator view) ─────────────────────────────────────────────────

router.get('/earnings', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total earnings
  const totalEarnings = await prisma.transaction.aggregate({
    where: { toUserId: userId, status: 'COMPLETED' },
    _sum: { creatorAmount: true, grossAmount: true },
    _count: true,
  });

  // This week
  const weekEarnings = await prisma.transaction.aggregate({
    where: { toUserId: userId, status: 'COMPLETED', createdAt: { gte: weekAgo } },
    _sum: { creatorAmount: true },
    _count: true,
  });

  // This month
  const monthEarnings = await prisma.transaction.aggregate({
    where: { toUserId: userId, status: 'COMPLETED', createdAt: { gte: monthAgo } },
    _sum: { creatorAmount: true },
    _count: true,
  });

  // By type
  const byType = await prisma.transaction.groupBy({
    by: ['type'],
    where: { toUserId: userId, status: 'COMPLETED' },
    _sum: { creatorAmount: true, grossAmount: true },
    _count: true,
  });

  res.json({
    total: {
      creatorEarnings: totalEarnings._sum.creatorAmount ?? 0,
      grossRevenue: totalEarnings._sum.grossAmount ?? 0,
      count: totalEarnings._count,
    },
    week: {
      creatorEarnings: weekEarnings._sum.creatorAmount ?? 0,
      count: weekEarnings._count,
    },
    month: {
      creatorEarnings: monthEarnings._sum.creatorAmount ?? 0,
      count: monthEarnings._count,
    },
    byType: byType.map((t) => ({
      type: t.type,
      creatorEarnings: t._sum.creatorAmount ?? 0,
      grossRevenue: t._sum.grossAmount ?? 0,
      count: t._count,
    })),
  });
});

export default router;
