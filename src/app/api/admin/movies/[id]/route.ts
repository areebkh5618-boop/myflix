import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { movieSchema } from "@/lib/validations/content";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = movieSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Validation failed" }, { status: 422 });
    }
    const data = parsed.data;

    const movie = await prisma.content.update({
      where: { id, type: "MOVIE" },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.status && { status: data.status as any, publishedAt: data.status === "PUBLISHED" ? new Date() : undefined }),
        ...(data.releaseYear !== undefined && { releaseYear: data.releaseYear }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.maturityRating !== undefined && { maturityRating: data.maturityRating }),
        ...(data.imdbRating !== undefined && { imdbRating: data.imdbRating }),
        ...(data.director !== undefined && { director: data.director }),
        ...(data.cast && { cast: data.cast }),
        ...(data.posterUrl !== undefined && { posterUrl: data.posterUrl }),
        ...(data.backdropUrl !== undefined && { backdropUrl: data.backdropUrl }),
        ...(data.trailerUrl !== undefined && { trailerUrl: data.trailerUrl }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.allowDownload !== undefined && { allowDownload: data.allowDownload }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      },
    });

    await prisma.auditLog.create({
      data: { adminId: user!.id, action: "MOVIE_UPDATED", targetType: "Content", targetId: id },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: movie });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.content.delete({ where: { id, type: "MOVIE" } });
    await prisma.auditLog.create({
      data: { adminId: user!.id, action: "MOVIE_DELETED", targetType: "Content", targetId: id },
    }).catch(() => {});
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
