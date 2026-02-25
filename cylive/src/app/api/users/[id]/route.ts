// ──────────────────────────────────────────────────────────────────────────────
// CYLive — User Profile API Route
// GET    /api/users/[id]  → Public profile
// PATCH  /api/users/[id]  → Update own profile (auth required)
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  bio: z.string().max(300).optional(),
  image: z.string().url().optional(),
  language: z.string().min(2).max(5).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        image: true,
        bio: true,
        role: true,
        tier: true,
        verified: true,
        followerCount: true,
        totalEarnings: true,
        createdAt: true,
        _count: {
          select: {
            streams: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[Users] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // If updating username, check uniqueness
    if (parsed.data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: parsed.data.username },
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: {
        id: true,
        displayName: true,
        username: true,
        image: true,
        bio: true,
        role: true,
        tier: true,
        verified: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[Users] PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
