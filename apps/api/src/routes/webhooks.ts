// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Stripe Webhooks  |  Verify Signature on EVERY Request
// ─────────────────────────────────────────────────────────────────────────────
// Handles exactly these events:
//   paymentIntent.succeeded     → processTransaction + verifyFee
//   paymentIntent.payment_failed → mark transaction pending
//   checkout.session.completed  → fulfill product purchase
//   customer.subscription.created → create subscription record
//   customer.subscription.updated → sync tier + status
//   customer.subscription.deleted → cancel subscription
//   account.updated             → sync charges enabled
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { verifyWebhookSignature, stripe } from '../services/stripe.js';
import { processTransaction, markTransactionFailed, verifyFee } from '../services/transactions.js';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { webhookLimiter } from '../middleware/rate-limit.js';
import { TxType } from '@prisma/client';

const router = Router();

// Webhook route uses raw body parser (configured in index.ts)
router.post('/stripe', webhookLimiter, async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event;
  try {
    event = verifyWebhookSignature(req.body, signature);
  } catch (err) {
    logger.error({ err }, 'Webhook signature verification failed');
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  logger.info({ type: event.type, id: event.id }, 'Stripe webhook received');

  try {
    switch (event.type) {
      // ── Payment Intent Succeeded ────────────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as any;
        const metadata = pi.metadata ?? {};

        // Verify fee: gross * 0.10
        if (pi.application_fee_amount != null) {
          const isValid = verifyFee(pi.amount / 100, pi.application_fee_amount / 100);
          if (!isValid) {
            logger.error(
              { piId: pi.id, amount: pi.amount, fee: pi.application_fee_amount },
              'FEE VERIFICATION FAILED — fee does not equal 10% of gross',
            );
          }
        }

        // Only process if we have our metadata (not a checkout session PI)
        if (metadata.type && metadata.fromUserId && metadata.toUserId) {
          // Check idempotency — skip if already processed
          const existing = await prisma.transaction.findFirst({
            where: { stripePaymentIntentId: pi.id },
          });

          if (!existing) {
            await processTransaction({
              grossAmount: pi.amount / 100,
              toUserId: metadata.toUserId,
              type: metadata.type as TxType,
              idempotencyKey: `wh-${pi.id}`,
              fromUserId: metadata.fromUserId,
              stageId: metadata.stageId || undefined,
              stripePaymentIntentId: pi.id,
            });
          }
        }
        break;
      }

      // ── Payment Intent Failed ──────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as any;
        await markTransactionFailed(pi.id);
        logger.warn({ piId: pi.id }, 'Payment intent failed');
        break;
      }

      // ── Checkout Session Completed (Product Purchase) ──────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const metadata = session.metadata ?? {};

        if (metadata.productId && metadata.buyerId) {
          // Fulfill product purchase
          await prisma.productPurchase.updateMany({
            where: { stripeSessionId: session.id },
            data: {
              status: 'completed',
              stripePaymentIntentId: session.payment_intent as string,
            },
          });

          // Decrement stock if applicable
          const product = await prisma.product.findUnique({
            where: { id: metadata.productId },
          });
          if (product?.stock != null) {
            await prisma.product.update({
              where: { id: metadata.productId },
              data: { stock: Math.max(0, product.stock - 1) },
            });
          }

          // Process through transaction system for ledger
          if (session.payment_intent) {
            const piData = await stripe.paymentIntents.retrieve(session.payment_intent as string);
            await processTransaction({
              grossAmount: piData.amount / 100,
              toUserId: product?.creatorId ?? metadata.creatorId,
              type: TxType.PRODUCT_SALE,
              idempotencyKey: `checkout-${session.id}`,
              fromUserId: metadata.buyerId,
              stripePaymentIntentId: session.payment_intent as string,
            });
          }
        }
        break;
      }

      // ── Subscription Created ──────────────────────────────────────────
      case 'customer.subscription.created': {
        const sub = event.data.object as any;
        const metadata = sub.metadata ?? {};

        if (metadata.creatorId && metadata.subscriberId) {
          await prisma.subscription.upsert({
            where: {
              subscriberId_creatorId: {
                subscriberId: metadata.subscriberId,
                creatorId: metadata.creatorId,
              },
            },
            update: {
              stripeSubscriptionId: sub.id,
              status: sub.status,
              tier: metadata.tier ?? 'BRONZE',
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
            create: {
              stripeSubscriptionId: sub.id,
              stripeCustomerId: sub.customer,
              status: sub.status,
              tier: metadata.tier ?? 'BRONZE',
              subscriberId: metadata.subscriberId,
              creatorId: metadata.creatorId,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
        }
        break;
      }

      // ── Subscription Updated ──────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }

      // ── Subscription Deleted ──────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'canceled' },
        });
        break;
      }

      // ── Account Updated (Connect) ─────────────────────────────────────
      case 'account.updated': {
        const account = event.data.object as any;
        const chargesEnabled = account.charges_enabled ?? false;

        if (account.metadata?.userId) {
          await prisma.user.update({
            where: { id: account.metadata.userId },
            data: { chargesEnabled },
          });
        } else {
          // Try to find by stripeAccountId
          await prisma.user.updateMany({
            where: { stripeAccountId: account.id },
            data: { chargesEnabled },
          });
        }
        break;
      }

      default:
        logger.info({ type: event.type }, 'Unhandled webhook event');
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err, eventType: event.type }, 'Webhook handler error');
    res.status(500).json({ error: 'Webhook handler error' });
  }
});

export default router;
