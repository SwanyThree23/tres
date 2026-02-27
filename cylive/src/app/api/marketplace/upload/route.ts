export const dynamic = "force-dynamic";
// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Video Post Upload API
// POST /api/marketplace/upload — Upload a video post to the market
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const uploadSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  isPaywalled: z.boolean().default(false),
  paywallAmountCents: z.number().int().min(99).optional(), // Min $0.99
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      isPaywalled,
      paywallAmountCents,
      videoUrl,
      thumbnailUrl,
    } = parsed.data;

    const post = await prisma.videoPost.create({
      data: {
        userId: session.user.id,
        title,
        description,
        isPaywalled,
        paywallAmount: isPaywalled ? paywallAmountCents : 0,
        videoUrl,
        thumbnailUrl:
          thumbnailUrl ||
          "https://images.unsplash.com/photo-1485846234645-a62644ffb1e7?w=800&q=80",
        viewCount: 0,
        likeCount: 0,
        duration: 0, // In a real app, calculate from video file
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("[Marketplace Upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to upload video post" },
      { status: 500 },
    );
  }
}
