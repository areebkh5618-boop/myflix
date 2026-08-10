import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { seasonId, episodeNumber, title, description, duration, videoUrl, thumbnailUrl, allowDownload } = body;
    if (!seasonId || !episodeNumber || !title) {
      return NextResponse.json({ success: false, message: "seasonId, episodeNumber, title required" }, { status: 400 });
    }

    const episode = await prisma.episode.create({
      data: {
        seasonId,
        episodeNumber: Number(episodeNumber),
        title,
        description: description || null,
        duration: duration ? Number(duration) : null,
        videoUrl: videoUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        allowDownload: !!allowDownload,
      },
    });
    return NextResponse.json({ success: true, data: episode }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ success: false, message: "Episode number already exists in this season" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}
