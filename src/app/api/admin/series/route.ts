import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { seriesSchema } from "@/lib/validations/content";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const series = await prisma.content.findMany({
    where: { type: "SERIES" },
    orderBy: { createdAt: "desc" },
    include: {
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: { episodes: { orderBy: { episodeNumber: "asc" } } },
      },
      genres: { include: { genre: true } },
    },
  });
  return NextResponse.json({ success: true, data: series });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = seriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 422 }
      );
    }
    const data = parsed.data;
    let slug = slugify(data.title);
    const existing = await prisma.content.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const series = await prisma.content.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        type: "SERIES",
        status: data.status as any,
        releaseYear: data.releaseYear,
        maturityRating: data.maturityRating,
        imdbRating: data.imdbRating,
        language: data.language,
        country: data.country,
        director: data.director,
        cast: data.cast || [],
        posterUrl: data.posterUrl,
        backdropUrl: data.backdropUrl,
        trailerUrl: data.trailerUrl,
        allowDownload: data.allowDownload,
        isFeatured: data.isFeatured,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user!.id,
        action: "SERIES_CREATED",
        targetType: "Content",
        targetId: series.id,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: series }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
