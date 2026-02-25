// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Individual Stream API Route
// GET    /api/streams/[id] — Fetch stream details
// PATCH  /api/streams/[id] — Update stream status/details
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateStreamSchema } from "@/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const stream = await prisma.stream.findUnique({
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
        _count: {
          select: { panels: true, messages: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    return NextResponse.json({ stream });
  } catch (error) {
    console.error("[Stream GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateStreamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await prisma.stream.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the stream
    const updateData: any = { ...parsed.data };

    // If setting to ENDED, record the end time
    if (updateData.status === "ENDED") {
      updateData.endedAt = new Date();
    }

    const stream = await prisma.stream.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ stream });
  } catch (error) {
    console.error("[Stream PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update stream" },
      { status: 500 },
    );
  }
}
