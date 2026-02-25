// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Audio Rooms API Route
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const rooms = await prisma.audioRoom.findMany({
      where: { status: "ACTIVE" },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            avatarEmoji: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("[AudioRooms GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
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
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid room data" }, { status: 400 });
    }

    const room = await prisma.audioRoom.create({
      data: {
        hostId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            avatarEmoji: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("[AudioRooms POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
