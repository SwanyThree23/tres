export const dynamic = "force-dynamic";
// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Chat API Route
// GET  /api/chat?streamId=xxx     → Fetch recent messages
// POST /api/chat                  → Send a chat message
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const chatMessageSchema = z.object({
  streamId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export async function GET(req: NextRequest) {
  try {
    const streamId = req.nextUrl.searchParams.get("streamId");
    if (!streamId) {
      return NextResponse.json(
        { error: "streamId is required" },
        { status: 400 },
      );
    }

    const messages = await prisma.message.findMany({
      where: { streamId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            image: true,
            tier: true,
            role: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("[Chat] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { streamId, content } = parsed.data;

    // Verify stream is live
    const stream = await prisma.stream.findFirst({
      where: { id: streamId, status: "LIVE" },
    });

    if (!stream) {
      return NextResponse.json(
        { error: "Stream not found or not live" },
        { status: 404 },
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        streamId,
        userId: session.user.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            image: true,
            tier: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[Chat] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
