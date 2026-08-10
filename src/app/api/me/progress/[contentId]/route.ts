import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { progressSchema } from "@/lib/validations/content";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const { contentId } = await params;
    const body = await req.json();
    const parsed = progressSchema.safeParse({ ...body, contentId });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { episodeId, currentTime, duration } = parsed.data;
    const progressPercentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    const completed = progressPercentage >= 90;
    const epId = episodeId || null;

    const existing = await prisma.watchProgress.findFirst({
      where: {
        userId: user!.id,
        contentId,
        episodeId: epId,
      },
    });

    let progress;
    if (existing) {
      progress = await prisma.watchProgress.update({
        where: { id: existing.id },
        data: {
          currentTime,
          duration,
          progressPercentage,
          completed,
          lastWatchedAt: new Date(),
        },
      });
    } else {
      progress = await prisma.watchProgress.create({
        data: {
          userId: user!.id,
          contentId,
          episodeId: epId,
          currentTime,
          duration,
          progressPercentage,
          completed,
        },
      });
    }

    if (progressPercentage > 5) {
      await prisma.watchHistory.create({
        data: {
          userId: user!.id,
          contentId,
          episodeId: epId,
          duration: currentTime,
          completed,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: progress });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
