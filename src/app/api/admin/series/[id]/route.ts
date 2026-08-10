import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const series = await prisma.content.findFirst({
    where: { id, type: "SERIES" },
    include: {
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
      },
    },
  });
  if (!series) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: series });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const series = await prisma.content.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.status && {
          status: body.status,
          publishedAt: body.status === "PUBLISHED" ? new Date() : undefined,
        }),
        ...(body.posterUrl !== undefined && { posterUrl: body.posterUrl }),
        ...(body.backdropUrl !== undefined && { backdropUrl: body.backdropUrl }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.trailerUrl !== undefined && { trailerUrl: body.trailerUrl }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.allowDownload !== undefined && { allowDownload: body.allowDownload }),
        ...(body.releaseYear !== undefined && { releaseYear: body.releaseYear }),
      },
    });
    await prisma.auditLog.create({
      data: { adminId: user!.id, action: "SERIES_UPDATED", targetType: "Content", targetId: id },
    }).catch(() => {});
    return NextResponse.json({ success: true, data: series });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.content.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { adminId: user!.id, action: "SERIES_DELETED", targetType: "Content", targetId: id },
  }).catch(() => {});
  return NextResponse.json({ success: true, message: "Deleted" });
}
