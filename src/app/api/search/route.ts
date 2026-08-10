import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const items = await prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { director: { contains: q, mode: "insensitive" } },
          { cast: { has: q } },
          { genres: { some: { genre: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      },
      take: 20,
      include: {
        genres: { include: { genre: true } },
      },
      orderBy: { viewCount: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
