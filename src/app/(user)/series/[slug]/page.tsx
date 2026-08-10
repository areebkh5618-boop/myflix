import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play } from "lucide-react";
import { LikeButton } from "@/components/movies/like-button";
import { WishlistButton } from "@/components/movies/wishlist-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SeriesPage({ params }: Props) {
  const session = await auth();
  const { slug } = await params;

  const content = await prisma.content.findUnique({
    where: { slug },
    include: {
      genres: { include: { genre: true } },
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
      },
    },
  });

  if (!content || content.status !== "PUBLISHED" || content.type !== "SERIES") {
    notFound();
  }

  let liked = false;
  let inList = false;
  if (session?.user) {
    const [like, wish] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_contentId: { userId: session.user.id, contentId: content.id } },
      }),
      prisma.wishlistItem.findUnique({
        where: { userId_contentId: { userId: session.user.id, contentId: content.id } },
      }),
    ]);
    liked = !!like;
    inList = !!wish;
  }

  const firstEpisode = content.seasons[0]?.episodes[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session?.user} />

      <div className="relative h-[50vh] md:h-[60vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${content.backdropUrl || content.posterUrl || ""})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="relative z-10 flex h-full items-end px-4 md:px-12 pb-10">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold">{content.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-white/70">
              {content.releaseYear && <span>{content.releaseYear}</span>}
              <span>{content.seasons.length} Season{content.seasons.length !== 1 ? "s" : ""}</span>
              {content.imdbRating && <span>★ {content.imdbRating}</span>}
            </div>
            <p className="text-white/80 line-clamp-3">{content.description}</p>
            <div className="flex flex-wrap gap-3">
              {session?.user && firstEpisode ? (
                <Link href={`/watch/${content.id}?episode=${firstEpisode.id}`}>
                  <Button size="lg" className="gap-2">
                    <Play className="h-5 w-5 fill-current" /> Play S1 E1
                  </Button>
                </Link>
              ) : (
                <Link href="/login?message=Please sign in to start watching.">
                  <Button size="lg" className="gap-2">
                    <Play className="h-5 w-5 fill-current" /> Play
                  </Button>
                </Link>
              )}
              {session?.user && (
                <>
                  <WishlistButton contentId={content.id} initial={inList} />
                  <LikeButton contentId={content.id} initial={liked} count={content.likeCount} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-12 mt-8 space-y-10">
        {content.seasons.map((season) => (
          <section key={season.id}>
            <h2 className="text-xl font-semibold mb-4">
              Season {season.seasonNumber}
              {season.title && season.title !== `Season ${season.seasonNumber}` ? `: ${season.title}` : ""}
            </h2>
            <div className="space-y-3">
              {season.episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="flex gap-4 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition"
                >
                  <div className="w-32 md:w-40 flex-shrink-0 aspect-video rounded overflow-hidden bg-card">
                    {ep.thumbnailUrl ? (
                      <img src={ep.thumbnailUrl} alt={ep.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-2xl font-bold text-white/30">
                        {ep.episodeNumber}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium">
                        {ep.episodeNumber}. {ep.title}
                      </h3>
                      {ep.duration && <span className="text-xs text-white/50 whitespace-nowrap">{ep.duration}m</span>}
                    </div>
                    {ep.description && (
                      <p className="text-sm text-white/60 mt-1 line-clamp-2">{ep.description}</p>
                    )}
                    {session?.user && ep.videoUrl && (
                      <Link
                        href={`/watch/${content.id}?episode=${ep.id}`}
                        className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                      >
                        <Play className="h-4 w-4" /> Play
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
