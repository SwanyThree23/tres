// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Streams API Route
// GET /api/streams — List streams (filterable by status, genre)
// POST /api/streams — Create a new stream
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createStreamSchema } from "@/schemas";
import { v4 as uuidv4 } from "uuid";

// ── GET: List Streams ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const genre = searchParams.get("genre");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {};
    if (status) where.status = status;
    if (genre) where.genre = genre;

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              avatarEmoji: true,
              tier: true,
              verified: true,
            },
          },
          _count: {
            select: { panels: true, messages: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 50),
        skip: offset,
      }),
      prisma.stream.count({ where }),
    ]);

    return NextResponse.json({
      streams,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Streams GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch streams" },
      { status: 500 },
    );
  }
}

// ── POST: Create Stream ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const parsed = createStreamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      genre,
      panelCount,
      isPaywalled,
      paywallAmountCents,
      auraMode,
      scheduledAt,
    } = parsed.data;

    // Enforce tier limits on panel count
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Panel limits by tier
    const panelLimits: Record<string, number> = {
      FREE: 1,
      CREATOR: 3,
      PRO: 3,
      STUDIO: 9,
    };

    const maxPanels = panelLimits[user.tier] || 1;
    if (panelCount > maxPanels) {
      return NextResponse.json(
        {
          error: `Your ${user.tier} tier allows up to ${maxPanels} panels. Upgrade to unlock more.`,
        },
        { status: 403 },
      );
    }

    // Aura mode requires PRO or STUDIO
    if (auraMode && user.tier !== "PRO" && user.tier !== "STUDIO") {
      return NextResponse.json(
        { error: "Aura AI co-host requires Pro or Studio tier" },
        { status: 403 },
      );
    }

    // Generate stream key (encrypted in prod, plain UUID for now)
    const streamKey = uuidv4().replace(/-/g, "");

    // Create the stream
    const stream = await prisma.stream.create({
      data: {
        userId: session.user.id,
        title,
        description,
        genre,
        status: scheduledAt ? "SCHEDULED" : "LIVE",
        panelCount,
        isPaywalled,
        paywallAmount: paywallAmountCents,
        streamKey,
        ingestUrl: `rtmps://ingest.cylive.app/live`,
        auraMode,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        startedAt: scheduledAt ? undefined : new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            tier: true,
          },
        },
      },
    });

    // Create the host panel (position 0)
    await prisma.streamPanel.create({
      data: {
        streamId: stream.id,
        userId: session.user.id,
        position: 0,
        role: "HOST",
      },
    });

    return NextResponse.json({ stream }, { status: 201 });
  } catch (error) {
    console.error("[Streams POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create stream" },
      { status: 500 },
    );
  }
}
