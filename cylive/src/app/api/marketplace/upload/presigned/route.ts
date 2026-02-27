export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generateUploadUrl,
  isAllowedVideoType,
  isAllowedImageType,
} from "@/lib/s3";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    const fileType = searchParams.get("fileType") as "video" | "image";
    const contentType = searchParams.get("contentType");

    if (!fileName || !fileType || !contentType) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters (fileName, fileType, contentType)",
        },
        { status: 400 },
      );
    }

    // Validation
    if (fileType === "video" && !isAllowedVideoType(contentType)) {
      return NextResponse.json(
        { error: "Invalid video type" },
        { status: 400 },
      );
    }
    if (fileType === "image" && !isAllowedImageType(contentType)) {
      return NextResponse.json(
        { error: "Invalid image type" },
        { status: 400 },
      );
    }

    const extension = fileName.split(".").pop() || "";
    const result = await generateUploadUrl(
      session.user.id,
      fileType,
      contentType,
      extension,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Presigned URL] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
