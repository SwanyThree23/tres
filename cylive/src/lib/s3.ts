// ──────────────────────────────────────────────────────────────────────────────
// CYLive — AWS S3 + CloudFront Helpers
// Pre-signed upload URLs, CloudFront distribution, thumbnail extraction
// ──────────────────────────────────────────────────────────────────────────────

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "cylive-media";
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";

// ── Pre-Signed Upload URL ───────────────────────────────────────────────────

interface UploadUrlResult {
  uploadUrl: string;
  key: string;
  cdnUrl: string;
}

/**
 * Generate a pre-signed PUT URL for direct browser upload to S3.
 * Returns the upload URL (15min expiry), the S3 object key, and the CDN URL.
 *
 * Flow:
 * 1. Client requests pre-signed URL from API
 * 2. Server generates it → returns { uploadUrl, key, cdnUrl }
 * 3. Client uploads directly to S3 (file never touches our server)
 * 4. Client notifies server on completion with the key
 */
export async function generateUploadUrl(
  userId: string,
  fileType: "video" | "image" | "avatar",
  contentType: string,
  fileExtension: string,
): Promise<UploadUrlResult> {
  const fileId = uuidv4();
  const key = `${fileType}s/${userId}/${fileId}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 900, // 15 minutes
  });

  const cdnUrl = CLOUDFRONT_DOMAIN
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

  return { uploadUrl, key, cdnUrl };
}

// ── CDN URL Builder ─────────────────────────────────────────────────────────

/**
 * Convert an S3 key to a CloudFront CDN URL.
 * Never serve raw S3 URLs to the browser.
 */
export function getCdnUrl(s3Key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
  }
  // Fallback for development
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
}

// ── Supported File Types ────────────────────────────────────────────────────

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_IMAGE_SIZE_MB = 10;

export function isAllowedVideoType(contentType: string): boolean {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(contentType);
}

export function isAllowedImageType(contentType: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
}

export { s3 };
export default s3;
