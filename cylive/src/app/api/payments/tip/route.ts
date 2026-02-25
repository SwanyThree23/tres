export const dynamic = "force-dynamic";
// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Tip API Route
// POST /api/payments/tip — Send a tip to a creator
// 90% goes to creator, 10% platform fee
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tipSchema } from "@/schemas";
import { createPaymentIntent, calculateSplit } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate
    const parsed = tipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { recipientId, amountCents, streamId, message } = parsed.data;

    // Can't tip yourself
    if (recipientId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot tip yourself" },
        { status: 400 },
      );
    }

    // Get sender and recipient
    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true, displayName: true },
      }),
      prisma.user.findUnique({
        where: { id: recipientId },
        select: {
          stripeConnectedAcctId: true,
          displayName: true,
          totalEarnings: true,
        },
      }),
    ]);

    if (!sender?.stripeCustomerId) {
      return NextResponse.json(
        { error: "You need to set up a payment method first" },
        { status: 400 },
      );
    }

    if (!recipient?.stripeConnectedAcctId) {
      return NextResponse.json(
        { error: "This creator has not set up payouts yet" },
        { status: 400 },
      );
    }

    // Calculate 90/10 split
    const { platformFeeCents, creatorPayoutCents } =
      calculateSplit(amountCents);

    // Create Stripe Payment Intent with application fee
    const paymentIntent = await createPaymentIntent(
      amountCents,
      sender.stripeCustomerId,
      recipient.stripeConnectedAcctId,
      {
        type: "tip",
        senderId: session.user.id,
        recipientId,
        ...(streamId && { streamId }),
      },
    );

    // Record in database
    const payment = await prisma.payment.create({
      data: {
        fromUserId: session.user.id,
        toUserId: recipientId,
        streamId,
        type: "TIP",
        amountCents,
        platformFeeCents,
        stripeTransferId: paymentIntent.id,
        note: message,
        status: "PENDING",
      },
    });

    // Update creator earnings (will be confirmed via webhook)
    await prisma.user.update({
      where: { id: recipientId },
      data: {
        totalEarnings: {
          increment: creatorPayoutCents / 100,
        },
      },
    });

    // If tipping during a stream, update stream earnings too
    if (streamId) {
      await prisma.stream.update({
        where: { id: streamId },
        data: {
          totalEarnings: {
            increment: creatorPayoutCents / 100,
          },
        },
      });
    }

    return NextResponse.json({
      payment,
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
      creatorPayout: creatorPayoutCents,
      platformFee: platformFeeCents,
    });
  } catch (error) {
    console.error("[Tip] Error:", error);
    return NextResponse.json(
      { error: "Failed to process tip" },
      { status: 500 },
    );
  }
}
