export const dynamic = "force-dynamic";
// ──────────────────────────────────────────────────────────────────────────────
// CYLive — User Registration API Route
// POST /api/auth/register
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/schemas";
import { createCustomer } from "@/lib/stripe";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, username, password, displayName } = parsed.data;

    // Check existing email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Check existing username
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create Stripe customer
    let stripeCustomerId: string | undefined;
    try {
      const customer = await createCustomer(email, displayName);
      stripeCustomerId = customer.id;
    } catch (err) {
      console.warn("[Register] Stripe customer creation failed:", err);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash,
        role: "VIEWER",
        tier: "FREE",
        stripeCustomerId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        tier: true,
        createdAt: true,
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, displayName).catch((err) =>
      console.warn("[Register] Welcome email failed:", err),
    );

    return NextResponse.json(
      { user, message: "Account created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
