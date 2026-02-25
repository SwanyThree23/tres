export const dynamic = "force-dynamic";
// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Aura AI API Route
// POST /api/aura — Generate Aura co-host response
// Rate limited: 20 calls/hour/stream · Pro/Studio only
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateAuraResponse,
  isAuraEligible,
  type AuraMode,
  type AuraTrigger,
} from "@/lib/aura";
import { z } from "zod";

const auraRequestSchema = z.object({
  streamId: z.string().uuid(),
  mode: z.enum(["SASSY", "HYPE", "CALM", "KIND"]),
  trigger: z.enum([
    "STREAM_START",
    "TIP_RECEIVED",
    "GIFT_RECEIVED",
    "VIEWER_JOIN",
    "STREAM_END",
  ]),
  context: z.object({
    streamTitle: z.string(),
    viewerCount: z.number().int().min(0),
    viewerName: z.string().optional(),
    tipAmount: z.number().int().min(0).optional(),
    giftType: z.string().optional(),
    isReturningViewer: z.boolean().optional(),
    peakViewers: z.number().int().min(0).optional(),
    totalEarnings: z.number().int().min(0).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const parsed = auraRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Verify tier eligibility (API-level gate)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true },
    });

    if (!user || !isAuraEligible(user.tier)) {
      return NextResponse.json(
        { error: "Aura AI requires Pro or Studio tier" },
        { status: 403 },
      );
    }

    // Verify stream ownership
    const stream = await prisma.stream.findFirst({
      where: {
        id: parsed.data.streamId,
        userId: session.user.id,
        status: "LIVE",
      },
    });

    if (!stream) {
      return NextResponse.json(
        { error: "Stream not found or not live" },
        { status: 404 },
      );
    }

    // Generate Aura response (rate-limited internally)
    const auraResponse = await generateAuraResponse(
      parsed.data.streamId,
      parsed.data.mode as AuraMode,
      parsed.data.trigger as AuraTrigger,
      parsed.data.context,
    );

    if (!auraResponse) {
      return NextResponse.json(
        {
          error: "Rate limit reached — Aura is silent until the next hour",
          rateLimited: true,
        },
        { status: 429 },
      );
    }

    // Store Aura message in the messages table
    await prisma.message.create({
      data: {
        streamId: parsed.data.streamId,
        userId: session.user.id,
        content: auraResponse.message,
        isAura: true,
      },
    });

    return NextResponse.json({
      message: auraResponse.message,
      mode: auraResponse.mode,
      trigger: auraResponse.trigger,
      rateLimitRemaining: auraResponse.rateLimitRemaining,
    });
  } catch (error) {
    console.error("[Aura] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Aura response" },
      { status: 500 },
    );
  }
}
