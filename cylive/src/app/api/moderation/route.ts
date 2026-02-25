export const dynamic = "force-dynamic";
// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Moderation API Route
// POST /api/moderation — Flag/moderate chat messages and users
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const moderationSchema = z.object({
  action: z.enum(["BAN", "TIMEOUT", "DELETE_MESSAGE", "WARNING"]),
  targetUserId: z.string().uuid(),
  streamId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  reason: z.string().max(200).optional(),
  duration: z.number().int().min(60).max(86400).optional(), // timeout duration in seconds
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = moderationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { action, targetUserId, streamId, messageId, reason, duration } =
      parsed.data;

    // Verify user is the stream owner or a platform admin
    const stream = await prisma.stream.findFirst({
      where: { id: streamId, status: "LIVE" },
      select: { userId: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isStreamOwner = stream.userId === session.user.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isStreamOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the stream owner or admins can moderate" },
        { status: 403 },
      );
    }

    // Can't moderate yourself
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot moderate yourself" },
        { status: 400 },
      );
    }

    // Execute moderation action
    switch (action) {
      case "DELETE_MESSAGE":
        if (messageId) {
          await prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true },
          });
        }
        break;

      case "TIMEOUT":
        await prisma.moderation.create({
          data: {
            streamId,
            targetUserId,
            moderatorId: session.user.id,
            action: "TIMEOUT",
            reason: reason || "Timeout by stream moderator",
            expiresAt: new Date(Date.now() + (duration || 300) * 1000),
          },
        });
        break;

      case "BAN":
        await prisma.moderation.create({
          data: {
            streamId,
            targetUserId,
            moderatorId: session.user.id,
            action: "BAN",
            reason: reason || "Banned from stream",
          },
        });
        break;

      case "WARNING":
        await prisma.moderation.create({
          data: {
            streamId,
            targetUserId,
            moderatorId: session.user.id,
            action: "WARNING",
            reason: reason || "Warning from moderator",
          },
        });
        break;
    }

    return NextResponse.json({
      success: true,
      action,
      targetUserId,
      message: `User ${action.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("[Moderation] Error:", error);
    return NextResponse.json(
      { error: "Moderation action failed" },
      { status: 500 },
    );
  }
}
