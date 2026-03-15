// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Products Routes  |  Creator Marketplace
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { stripe, computeFeeSplit } from '../services/stripe.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(10000),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().positive().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(10000).optional(),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().positive().optional(),
});

// ── List active products (public, filter by creator) ────────────────────────

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const creatorId = req.query.creatorId as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const where: any = { status: 'ACTIVE' };
  if (creatorId) where.creatorId = creatorId;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page, limit, pages: Math.ceil(total / limit) });
});

// ── Create product (auto-creates Stripe product + price) ────────────────────

router.post('/', requireAuth, requireRole('CREATOR', 'ADMIN'), async (req: Request, res: Response) => {
  const data = createProductSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user?.stripeAccountId || !user.chargesEnabled) {
    throw new AppError(400, 'Set up Stripe Connect first');
  }

  // Create Stripe product + price
  const stripeProduct = await stripe.products.create({
    name: data.name,
    description: data.description,
    metadata: { creatorId: req.user!.sub },
  });

  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(data.price * 100),
    currency: 'usd',
  });

  const product = await prisma.product.create({
    data: {
      ...data,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
      creatorId: req.user!.sub,
    },
  });

  res.status(201).json(product);
});

// ── Update product ──────────────────────────────────────────────────────────

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id as string } });
  if (!product) throw new AppError(404, 'Product not found');
  if (product.creatorId !== req.user!.sub) throw new AppError(403, 'Not authorized');

  const data = updateProductSchema.parse(req.body);

  // If price changed, create new Stripe price
  if (data.price && data.price !== product.price) {
    const newPrice = await stripe.prices.create({
      product: product.stripeProductId!,
      unit_amount: Math.round(data.price * 100),
      currency: 'usd',
    });
    (data as any).stripePriceId = newPrice.id;
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id as string },
    data,
  });

  res.json(updated);
});

// ── Soft delete product ─────────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id as string } });
  if (!product) throw new AppError(404, 'Product not found');
  if (product.creatorId !== req.user!.sub) throw new AppError(403, 'Not authorized');

  await prisma.product.update({
    where: { id: req.params.id as string },
    data: { status: 'DELETED' },
  });

  // Archive Stripe product
  if (product.stripeProductId) {
    await stripe.products.update(product.stripeProductId, { active: false });
  }

  res.json({ success: true });
});

// ── Purchase product (Stripe Checkout with 90/10 split) ─────────────────────

router.post('/:id/purchase', requireAuth, async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
    include: { creator: true },
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new AppError(404, 'Product not found or not available');
  }

  if (!product.creator.stripeAccountId || !product.creator.chargesEnabled) {
    throw new AppError(400, 'Creator not set up for payments');
  }

  // Check stock
  if (product.stock !== null && product.stock <= 0) {
    throw new AppError(400, 'Product out of stock');
  }

  const priceCents = Math.round(product.price * 100);
  const { platformFee } = computeFeeSplit(priceCents);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: req.user!.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: product.creator.stripeAccountId },
      metadata: {
        productId: product.id,
        buyerId: req.user!.sub,
        creatorId: product.creatorId,
        type: 'PRODUCT_SALE',
      },
    },
    success_url: `${process.env.FRONTEND_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/purchase/cancel`,
    metadata: {
      productId: product.id,
      buyerId: req.user!.sub,
    },
  });

  // Create pending purchase
  await prisma.productPurchase.create({
    data: {
      stripeSessionId: session.id,
      buyerId: req.user!.sub,
      productId: product.id,
    },
  });

  res.json({ checkoutUrl: session.url });
});

export default router;
