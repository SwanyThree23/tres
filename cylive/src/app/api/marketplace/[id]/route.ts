export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const post = await prisma.videoPost.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let hasAccess = !post.isPaywalled || post.userId === userId;

    if (!hasAccess && userId) {
      // Check for successful payment
      const payment = await prisma.payment.findFirst({
        where: {
          videoPost: { id: params.id },
          fromUserId: userId,
          status: "SUCCEEDED",
          type: "PAYWALL",
        },
      });
      if (payment) hasAccess = true;
    }

    // Incremental view count (simplified)
    if (hasAccess) {
      await prisma.videoPost.update({
        where: { id: params.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    // If no access, hide the video URL
    const sanitizedPost = {
      ...post,
      videoUrl: hasAccess ? post.videoUrl : null,
    };

    return NextResponse.json({ post: sanitizedPost, hasAccess });
  } catch (error) {
    console.error("[Marketplace Item GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}
