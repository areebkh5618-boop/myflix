import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { movieSchema } from "@/lib/validations/content";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const where: any = { type: "MOVIE" };
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (status) where.status = status;

  const movies = await prisma.content.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { genres: { include: { genre: true } } },
  });
  return NextResponse.json({ success: true, data: movies });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = movieSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Validation failed", errors: parsed.error.flatten() }, { status: 422 });
    }
    const data = parsed.data;
    let slug = slugify(data.title);
    const existing = await prisma.content.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const movie = await prisma.content.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        type: "MOVIE",
        status: data.status as any,
        releaseYear: data.releaseYear,
        duration: data.duration,
        maturityRating: data.maturityRating,
        imdbRating: data.imdbRating,
        language: data.language,
        country: data.country,
        director: data.director,
        cast: data.cast || [],
        posterUrl: data.posterUrl,
        backdropUrl: data.backdropUrl,
        trailerUrl: data.trailerUrl,
        videoUrl: data.videoUrl,
        allowDownload: data.allowDownload,
        isFeatured: data.isFeatured,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        genres: data.genreIds?.length
          ? { create: data.genreIds.map((id: string) => ({ genreId: id })) }
          : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user!.id,
        action: "MOVIE_CREATED",
        targetType: "Content",
        targetId: movie.id,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: movie }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
