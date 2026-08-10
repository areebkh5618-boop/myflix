import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const items = await prisma.watchProgress.findMany({
      where: {
        userId: user!.id,
        completed: false,
        progressPercentage: { gte: 5, lt: 90 },
      },
      orderBy: { lastWatchedAt: "desc" },
      take: 20,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            posterUrl: true,
            backdropUrl: true,
            duration: true,
          },
        },
        episode: {
          select: {
            id: true,
            title: true,
            episodeNumber: true,
            thumbnailUrl: true,
            duration: true,
            season: { select: { seasonNumber: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
