import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { progressSchema } from "@/lib/validations/content";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { error, user } = await requireUser();

  if (error) {
    return error;
  }

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const { contentId } = await params;
    const body = await req.json();

    const parsed = progressSchema.safeParse({
      ...body,
      contentId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        {
          status: 422,
        }
      );
    }

    const {
      episodeId,
      currentTime,
      duration,
    } = parsed.data;

    const safeCurrentTime = currentTime ?? 0;
    const safeDuration = duration ?? 0;
    const epId = episodeId ?? null;

    const progressPercentage =
      safeDuration > 0
        ? Math.min(
            100,
            Math.max(
              0,
              (safeCurrentTime / safeDuration) * 100
            )
          )
        : 0;

    const completed = progressPercentage >= 90;

    const existing =
      await prisma.watchProgress.findFirst({
        where: {
          userId: user.id,
          contentId,
          episodeId: epId,
        },
      });

    const progress = existing
      ? await prisma.watchProgress.update({
          where: {
            id: existing.id,
          },
          data: {
            currentTime: safeCurrentTime,
            duration: safeDuration,
            progressPercentage,
            completed,
            lastWatchedAt: new Date(),
          },
        })
      : await prisma.watchProgress.create({
          data: {
            userId: user.id,
            contentId,
            episodeId: epId,
            currentTime: safeCurrentTime,
            duration: safeDuration,
            progressPercentage,
            completed,
          },
        });

    if (progressPercentage > 5) {
      await prisma.watchHistory
        .create({
          data: {
            userId: user.id,
            contentId,
            episodeId: epId,
            duration: safeCurrentTime,
            completed,
          },
        })
        .catch((historyError) => {
          console.error(
            "Failed to create watch history:",
            historyError
          );
        });
    }

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Progress update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}