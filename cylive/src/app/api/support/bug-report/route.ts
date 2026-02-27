export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { title, device, steps, severity } = body;

    const report = await prisma.bugReport.create({
      data: {
        userId: session?.user?.id || null,
        title,
        device,
        stepsToReproduce: steps,
        severity,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[Bug Report API] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 },
    );
  }
}
