// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Stream Messages API Route
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import auraService from "@/lib/aura";

const messageSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const messages = await prisma.message.findMany({
      where: { streamId: params.id, isDeleted: false },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            tier: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Messages GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 },
      );
    }

    const message = await prisma.message.create({
      data: {
        streamId: params.id,
        userId: session.user.id,
        content: parsed.data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            tier: true,
          },
        },
      },
    });

    // ── Aura AI Logic ────────────────────────────────────────────────────────
    let auraResponse = null;
    const stream = await prisma.stream.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (parsed.data.content.toLowerCase().includes("@aura") && stream) {
      if (auraService.isAuraEligible(stream.user.tier)) {
        auraResponse = await auraService.generateAuraResponse(
          params.id,
          stream.auraMode || "HYPE",
          "VIEWER_JOIN", // generic trigger for chat
          {
            streamTitle: stream.title,
            viewerCount: stream.peakViewers || 0,
            viewerName: message.user.displayName || message.user.username,
          },
        );

        if (auraResponse) {
          // Create Aura's own message in DB
          await prisma.message.create({
            data: {
              streamId: params.id,
              userId: "aura-ai-system-id", // Placeholder or dedicated AI user
              content: auraResponse.message,
              isAura: true,
            },
          });
        }
      }
    }

    return NextResponse.json({ message, auraResponse });
  } catch (error) {
    console.error("[Messages POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
