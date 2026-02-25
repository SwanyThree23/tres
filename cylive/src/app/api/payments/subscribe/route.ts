// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Subscription API Route
// POST /api/payments/subscribe — Subscribe to a creator
// Fan ($5), Supporter ($10), Ride or Die ($20)
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subscribeSchema } from "@/schemas";
import { VIEWER_SUB_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { creatorId, tier } = parsed.data;

    // Can't subscribe to yourself
    if (creatorId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot subscribe to yourself" },
        { status: 400 },
      );
    }

    // Check existing subscription
    const existing = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: session.user.id,
          creatorId,
        },
      },
    });

    if (existing && existing.status === "ACTIVE") {
      return NextResponse.json(
        { error: "You already have an active subscription to this creator" },
        { status: 409 },
      );
    }

    // Get both users' Stripe info
    const [subscriber, creator] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true },
      }),
      prisma.user.findUnique({
        where: { id: creatorId },
        select: { stripeConnectedAcctId: true, displayName: true },
      }),
    ]);

    if (!subscriber?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Payment method required" },
        { status: 400 },
      );
    }

    if (!creator?.stripeConnectedAcctId) {
      return NextResponse.json(
        { error: "Creator has not set up payouts" },
        { status: 400 },
      );
    }

    const amountCents = VIEWER_SUB_PRICES[tier];

    // Create subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        subscriberId: session.user.id,
        creatorId,
        tier,
        amountCents,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      subscription,
      amount: amountCents,
      tier,
    });
  } catch (error) {
    console.error("[Subscribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
