// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Marketplace API Route
// GET /api/marketplace — Fetch video posts
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};
    if (filter === "free") where.isPaywalled = false;
    if (filter === "premium") where.isPaywalled = true;

    const posts = await prisma.videoPost.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.videoPost.count({ where });

    return NextResponse.json({
      posts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Marketplace GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace posts" },
      { status: 500 },
    );
  }
}
