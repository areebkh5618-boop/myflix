import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const likes = await prisma.like.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            posterUrl: true,
            releaseYear: true,
            imdbRating: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: likes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
