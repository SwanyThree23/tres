// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Stripe Webhook Handler
// POST /api/payments/webhook
// Handles payment confirmations, subscription events, refunds
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Payment Success ───────────────────────────────────────────
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentType = paymentIntent.metadata?.type;

        if (paymentType) {
          await prisma.payment.updateMany({
            where: { stripeTransferId: paymentIntent.id },
            data: { status: "SUCCEEDED" },
          });
        }
        break;
      }

      // ── Payment Failed ────────────────────────────────────────────
      case "payment_intent.payment_failed": {
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        await prisma.payment.updateMany({
          where: { stripeTransferId: failedIntent.id },
          data: { status: "FAILED" },
        });
        break;
      }

      // ── Subscription Created ──────────────────────────────────────
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        // Subscription is created by our API, just confirm it's active
        if (
          subscription.metadata?.subscriberId &&
          subscription.metadata?.creatorId
        ) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { status: "ACTIVE" },
          });
        }
        break;
      }

      // ── Subscription Updated ──────────────────────────────────────
      case "customer.subscription.updated": {
        const updated = event.data.object as Stripe.Subscription;
        const status =
          updated.status === "active"
            ? "ACTIVE"
            : updated.status === "past_due"
              ? "PAST_DUE"
              : "CANCELLED";

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: updated.id },
          data: {
            status: status as "ACTIVE" | "PAST_DUE" | "CANCELLED",
            currentPeriodEnd: new Date(
              (updated as unknown as Record<string, number>)
                .current_period_end * 1000,
            ),
          },
        });
        break;
      }

      // ── Subscription Cancelled ────────────────────────────────────
      case "customer.subscription.deleted": {
        const cancelled = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: cancelled.id },
          data: { status: "CANCELLED" },
        });
        break;
      }

      // ── Charge Refunded ───────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await prisma.payment.updateMany({
            where: { stripeTransferId: charge.payment_intent as string },
            data: { status: "REFUNDED" },
          });
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
