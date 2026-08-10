import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const { contentId } = await params;

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content || content.status !== "PUBLISHED") {
      return NextResponse.json({ success: false, message: "Content not found" }, { status: 404 });
    }

    const like = await prisma.like.upsert({
      where: { userId_contentId: { userId: user!.id, contentId } },
      update: {},
      create: { userId: user!.id, contentId },
    });

    await prisma.content.update({
      where: { id: contentId },
      data: { likeCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: like, message: "Liked" });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ success: true, message: "Already liked" });
    }
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const { contentId } = await params;

    const deleted = await prisma.like.deleteMany({
      where: { userId: user!.id, contentId },
    });

    if (deleted.count > 0) {
      await prisma.content.update({
        where: { id: contentId },
        data: { likeCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true, message: "Unliked" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
