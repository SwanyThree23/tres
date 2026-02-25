// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Payout API Route
// POST /api/payments/payout — Request a payout to Stripe Connected Account
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { transferToCreator, getAccountBalance } from "@/lib/stripe";
import { z } from "zod";

const payoutSchema = z.object({
  amountCents: z.number().int().min(1000, "Minimum payout is $10.00"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = payoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { amountCents } = parsed.data;

    // Fetch user and their connected account ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        stripeConnectedAcctId: true,
        totalEarnings: true,
        tier: true,
      },
    });

    if (!user || !user.stripeConnectedAcctId) {
      return NextResponse.json(
        {
          error:
            "Stripe Connected Account not found. Please setup onboarding first.",
        },
        { status: 400 },
      );
    }

    // Check if user has enough total earnings recorded (app-level check)
    if (Number(user.totalEarnings) * 100 < amountCents) {
      return NextResponse.json(
        { error: "Insufficient balance in your CYLive earnings." },
        { status: 400 },
      );
    }

    // Optional: Double check Stripe balance (might have pending funds)
    // const balance = await getAccountBalance(user.stripeConnectedAcctId);
    // ... logic to verify available balance on Stripe ...

    // Execute transfer
    const transfer = await transferToCreator(
      amountCents,
      user.stripeConnectedAcctId,
      {
        userId: user.id,
        type: "payout",
      },
    );

    // Record the payout in the database
    const payment = await prisma.payment.create({
      data: {
        toUserId: user.id, // Creator is the "receiver" in terms of payout flow tracking
        type: "PAYOUT",
        amountCents,
        status: "SUCCEEDED",
        stripeTransferId: transfer.id,
        note: "Creator requested payout",
      },
    });

    // Deduct from user's total earnings in DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalEarnings: {
          decrement: amountCents / 100,
        },
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      amountCents: payment.amountCents,
      status: payment.status,
    });
  } catch (error: any) {
    console.error("[Payout] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process payout" },
      { status: 500 },
    );
  }
}
