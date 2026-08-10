import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { contentId, seasonNumber, title, description } = body;
    if (!contentId || !seasonNumber) {
      return NextResponse.json({ success: false, message: "contentId and seasonNumber required" }, { status: 400 });
    }

    const season = await prisma.season.create({
      data: {
        contentId,
        seasonNumber: Number(seasonNumber),
        title: title || `Season ${seasonNumber}`,
        description: description || null,
      },
    });
    return NextResponse.json({ success: true, data: season }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ success: false, message: "Season number already exists" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}
