import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const { id } = await params;
    const content = await prisma.content.findUnique({ where: { id } });
    if (!content || content.status !== "PUBLISHED") {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    if (!content.allowDownload) {
      return NextResponse.json({ success: false, message: "Downloads disabled" }, { status: 403 });
    }
    if (!content.videoUrl) {
      return NextResponse.json({ success: false, message: "No video" }, { status: 404 });
    }

    await prisma.download.create({
      data: { userId: user!.id, contentId: id },
    });

    return NextResponse.redirect(content.videoUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}
