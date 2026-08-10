import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play, Plus, ThumbsUp, Download, Check } from "lucide-react";
import { LikeButton } from "@/components/movies/like-button";
import { WishlistButton } from "@/components/movies/wishlist-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MoviePage({ params }: Props) {
  const session = await auth();
  const { slug } = await params;

  const content = await prisma.content.findUnique({
    where: { slug },
    include: {
      genres: { include: { genre: true } },
    },
  });

  if (!content || content.status !== "PUBLISHED" || content.type !== "MOVIE") {
    notFound();
  }

  let liked = false;
  let inList = false;
  let progress = null;

  if (session?.user) {
    const [like, wish, prog] = await Promise.all([
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
    liked = !!like;
    inList = !!wish;
    progress = prog;
  }

  const related = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      type: "MOVIE",
      id: { not: content.id },
      genres: {
        some: {
          genreId: { in: content.genres.map((g) => g.genreId) },
        },
      },
    },
    take: 6,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session?.user} />

      {/* Hero backdrop */}
      <div className="relative h-[60vh] md:h-[70vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${content.backdropUrl || content.posterUrl || ""})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="relative z-10 flex h-full items-end px-4 md:px-12 pb-12">
          <div className="flex flex-col md:flex-row gap-8 max-w-5xl">
            {content.posterUrl && (
              <img
                src={content.posterUrl}
                alt={content.title}
                className="hidden md:block w-48 rounded-lg shadow-2xl object-cover"
              />
            )}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white">{content.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                {content.releaseYear && <span>{content.releaseYear}</span>}
                {content.duration && <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>}
                {content.maturityRating && (
                  <span className="border border-white/40 px-1.5 rounded text-xs">{content.maturityRating}</span>
                )}
                {content.imdbRating && <span>★ {content.imdbRating}</span>}
                <span>{content.viewCount} views</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {content.genres.map((g) => (
                  <span key={g.genreId} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {g.genre.name}
                  </span>
                ))}
              </div>
              <p className="text-white/80 max-w-xl line-clamp-4">{content.description}</p>
              {content.director && (
                <p className="text-sm text-white/60">Director: <span className="text-white/90">{content.director}</span></p>
              )}
              {content.cast?.length > 0 && (
                <p className="text-sm text-white/60">Cast: <span className="text-white/90">{content.cast.join(", ")}</span></p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {session?.user ? (
                  <Link href={`/watch/${content.id}`}>
                    <Button size="lg" className="gap-2">
                      <Play className="h-5 w-5 fill-current" />
                      {progress && progress.progressPercentage > 5 && !progress.completed
                        ? `Resume ${Math.round(progress.progressPercentage)}%`
                        : "Play"}
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
                    {content.allowDownload && (
                      <a href={`/api/download/${content.id}`}>
                        <Button variant="outline" size="lg" className="gap-2">
                          <Download className="h-5 w-5" /> Download
                        </Button>
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="px-4 md:px-12 mt-10">
          <h2 className="text-xl font-semibold mb-4">More Like This</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/movie/${r.slug}`} className="group">
                <div className="aspect-[2/3] rounded overflow-hidden bg-card">
                  {r.posterUrl ? (
                    <img src={r.posterUrl} alt={r.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted p-2 text-center">{r.title}</div>
                  )}
                </div>
                <p className="mt-1 text-sm truncate">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
