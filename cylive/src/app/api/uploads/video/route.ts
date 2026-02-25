// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Video Upload API Route
// POST /api/uploads/video — Generate pre-signed S3 upload URL
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadRequestSchema } from "@/schemas";
import {
  generateUploadUrl,
  isAllowedVideoType,
  isAllowedImageType,
  MAX_VIDEO_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
} from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { contentType, fileExtension, fileType } = parsed.data;

    // Validate content type
    if (fileType === "video" && !isAllowedVideoType(contentType)) {
      return NextResponse.json(
        {
          error: `Invalid video type. Allowed: MP4, WebM, QuickTime`,
          maxSize: `${MAX_VIDEO_SIZE_MB}MB`,
        },
        { status: 400 },
      );
    }

    if (
      (fileType === "image" || fileType === "avatar") &&
      !isAllowedImageType(contentType)
    ) {
      return NextResponse.json(
        {
          error: `Invalid image type. Allowed: JPEG, PNG, WebP, GIF`,
          maxSize: `${MAX_IMAGE_SIZE_MB}MB`,
        },
        { status: 400 },
      );
    }

    // Generate pre-signed URL (15-minute expiry)
    const { uploadUrl, key, cdnUrl } = await generateUploadUrl(
      session.user.id,
      fileType,
      contentType,
      fileExtension,
    );

    return NextResponse.json({
      uploadUrl,
      key,
      cdnUrl,
      expiresIn: 900, // 15 minutes
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
