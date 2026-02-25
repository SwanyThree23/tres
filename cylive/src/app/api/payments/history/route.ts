// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Transaction History API Route
// GET /api/payments/history — Fetch payment history for the current user
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch payments sent by user or received by user
    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ fromUserId: session.user.id }, { toUserId: session.user.id }],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        toUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        stream: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.payment.count({
      where: {
        OR: [{ fromUserId: session.user.id }, { toUserId: session.user.id }],
      },
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        type: p.type,
        amountCents: p.amountCents,
        status: p.status,
        note: p.note,
        createdAt: p.createdAt,
        isOutgoing: p.fromUserId === session.user.id,
        counterparty: p.fromUserId === session.user.id ? p.toUser : p.fromUser,
        streamTitle: p.stream?.title,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Payment History] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 },
    );
  }
}
