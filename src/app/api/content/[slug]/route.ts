import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();

    const content = await prisma.content.findUnique({
      where: { slug },
      include: {
        genres: { include: { genre: true } },
        seasons: {
          orderBy: { seasonNumber: "asc" },
          include: {
            episodes: {
              orderBy: { episodeNumber: "asc" },
              select: {
                id: true,
                episodeNumber: true,
                title: true,
                description: true,
                duration: true,
                thumbnailUrl: true,
                releaseDate: true,
              },
            },
          },
        },
      },
    });

    if (!content || content.status !== "PUBLISHED") {
      return NextResponse.json({ success: false, message: "Content not found" }, { status: 404 });
    }

    let userState: any = null;
    if (session?.user?.id) {
      const [like, wishlist, progress] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_contentId: { userId: session.user.id, contentId: content.id } },
        }),
        prisma.wishlistItem.findUnique({
          where: { userId_contentId: { userId: session.user.id, contentId: content.id } },
        }),
        prisma.watchProgress.findFirst({
          where: { userId: session.user.id, contentId: content.id, episodeId: null },
        }),
      ]);
      userState = {
        liked: !!like,
        inWishlist: !!wishlist,
        progress: progress || null,
      };
    }

    return NextResponse.json({ success: true, data: { ...content, userState } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
