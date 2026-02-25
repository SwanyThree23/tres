// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Follow/Unfollow API Route
// POST /api/users/[id]/follow — Toggle follow status
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followerId = session.user.id;
    const followingId = params.id;

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 },
      );
    }

    // Check if following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      // Unfollow
      await prisma.$transaction([
        prisma.follow.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId,
            },
          },
        }),
        prisma.user.update({
          where: { id: followingId },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            followerId,
            followingId,
          },
        }),
        prisma.user.update({
          where: { id: followingId },
          data: { followerCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("[Follow] Error:", error);
    return NextResponse.json(
      { error: "Failed to update follow status" },
      { status: 500 },
    );
  }
}

// GET /api/users/[id]/follow — Check if following
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ following: false });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: params.id,
        },
      },
    });

    return NextResponse.json({ following: !!existing });
  } catch {
    return NextResponse.json({ following: false });
  }
}
