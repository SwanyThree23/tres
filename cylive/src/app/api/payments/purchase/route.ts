export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoPostId } = await req.json();

    if (!videoPostId) {
      return NextResponse.json(
        { error: "Missing videoPostId" },
        { status: 400 },
      );
    }

    const post = await prisma.videoPost.findUnique({
      where: { id: videoPostId },
      select: { userId: true, paywallAmount: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Mock payment creation
    // In production, this would be handled by Stripe webhooks or client-side confirmation
    const payment = await prisma.payment.create({
      data: {
        fromUserId: session.user.id,
        toUserId: post.userId,
        videoPostId: videoPostId,
        type: "PAYWALL",
        amountCents: post.paywallAmount || 0,
        status: "SUCCEEDED", // Auto-succeed for demo
      },
    });

    // Update creator total earnings
    await prisma.user.update({
      where: { id: post.userId },
      data: {
        totalEarnings: {
          increment: (post.paywallAmount || 0) / 100,
        },
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("[Purchase Mock] Error:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 },
    );
  }
}
