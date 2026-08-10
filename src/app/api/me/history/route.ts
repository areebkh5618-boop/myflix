import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const items = await prisma.watchHistory.findMany({
      where: { userId: user!.id },
      orderBy: { watchedAt: "desc" },
      take: 50,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            posterUrl: true,
            releaseYear: true,
          },
        },
        episode: {
          select: {
            id: true,
            title: true,
            episodeNumber: true,
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

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.watchHistory.deleteMany({
        where: { id, userId: user!.id },
      });
    } else {
      await prisma.watchHistory.deleteMany({
        where: { userId: user!.id },
      });
    }

    return NextResponse.json({ success: true, message: "History cleared" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
