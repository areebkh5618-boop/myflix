import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // MOVIE | SERIES
    const genre = searchParams.get("genre");
    const featured = searchParams.get("featured");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    const where: any = { status: "PUBLISHED" };
    if (type) where.type = type;
    if (featured === "true") where.isFeatured = true;
    if (genre) {
      where.genres = { some: { genre: { slug: genre } } };
    }

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          genres: { include: { genre: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
