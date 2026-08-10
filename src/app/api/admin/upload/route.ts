import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";

import { requireAdmin } from "@/lib/permissions";

export const runtime = "nodejs";

const ALLOWED_IMAGE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_VIDEO = [
  "video/mp4",
  "video/webm",
  "video/ogg",
];

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 1024 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
};

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();

  if (error) {
    return error;
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        {
          status: 400,
        }
      );
    }

    const type = file.type;
    const isImage = ALLOWED_IMAGE.includes(type);
    const isVideo = ALLOWED_VIDEO.includes(type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only images (jpg, png, webp, gif) or videos (mp4, webm, ogg) are allowed",
        },
        {
          status: 400,
        }
      );
    }

    if (isImage && file.size > MAX_IMAGE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image size must not exceed 10MB",
        },
        {
          status: 400,
        }
      );
    }

    if (isVideo && file.size > MAX_VIDEO) {
      return NextResponse.json(
        {
          success: false,
          message: "Video size must not exceed 1GB",
        },
        {
          status: 400,
        }
      );
    }

    const extension = MIME_EXTENSIONS[type];

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported file type",
        },
        {
          status: 400,
        }
      );
    }

    const filename = `${randomUUID()}.${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadDir, {
      recursive: true,
    });

    const targetPath = path.join(uploadDir, filename);

    const fileStream = Readable.fromWeb(
      file.stream() as unknown as NodeReadableStream<Uint8Array>
    );

    const writeStream = createWriteStream(targetPath);

    await pipeline(fileStream, writeStream);

    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        type: isImage ? "image" : "video",
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Upload failed",
      },
      {
        status: 500,
      }
    );
  }
}