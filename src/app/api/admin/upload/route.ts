import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export const runtime = "nodejs";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/ogg"];
const MAX_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO = 1024 * 1024 * 1024; // 1GB

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const type = file.type;
    const isImage = ALLOWED_IMAGE.includes(type);
    const isVideo = ALLOWED_VIDEO.includes(type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, message: "Only images (jpg/png/webp) or videos (mp4/webm) allowed" },
        { status: 400 }
      );
    }

    if (isImage && file.size > MAX_IMAGE) {
      return NextResponse.json({ success: false, message: "Image max 10MB" }, { status: 400 });
    }
    if (isVideo && file.size > MAX_VIDEO) {
      return NextResponse.json({ success: false, message: "Video max 1GB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp4");
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const targetPath = path.join(uploadDir, filename);
    const fileStream = Readable.fromWeb(file.stream());
    const writeStream = createWriteStream(targetPath);

    await pipeline(fileStream, writeStream);

    const url = `/uploads/${filename}`;
    return NextResponse.json({
      success: true,
      data: { url, filename, type: isImage ? "image" : "video", size: file.size },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
