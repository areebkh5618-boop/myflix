import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  // Allow anonymous views too, but track user if logged in
  try {
    const body = await req.json();
    const { contentId, episodeId, watchDuration } = body;

    if (!contentId) {
      return NextResponse.json({ success: false, message: "contentId required" }, { status: 400 });
    }

    await prisma.view.create({
      data: {
        userId: user?.id || null,
        contentId,
        episodeId: episodeId || null,
        watchDuration: watchDuration || null,
      },
    });

    await prisma.content.update({
      where: { id: contentId },
      data: { viewCount: { increment: 1 } },
    });

    if (episodeId) {
      await prisma.episode.update({
        where: { id: episodeId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
