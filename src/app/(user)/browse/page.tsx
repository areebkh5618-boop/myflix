import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ContentRow } from "@/components/movies/content-row";
import prisma from "@/lib/db";
import Link from "next/link";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function BrowsePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [featured, recent, popular, continueWatching] = await Promise.all([
    prisma.content.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      take: 1,
      include: { genres: { include: { genre: true } } },
    }),
    prisma.content.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.content.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 12,
    }),
    prisma.watchProgress.findMany({
      where: {
        userId: session.user.id,
        completed: false,
        progressPercentage: { gte: 5, lt: 90 },
      },
      orderBy: { lastWatchedAt: "desc" },
      take: 10,
      include: {
        content: true,
        episode: true,
      },
    }),
  ]);

  const hero = featured[0] || recent[0];

  const continueItems = continueWatching.map((p) => ({
    id: p.content.id,
    title: p.episode
      ? `${p.content.title} S${p.episode.season?.seasonNumber || "?"}E${p.episode.episodeNumber}`
      : p.content.title,
    slug: p.content.slug,
    posterUrl: p.content.posterUrl,
    releaseYear: p.content.releaseYear,
    imdbRating: p.content.imdbRating,
    type: p.content.type,
    progressPercentage: p.progressPercentage,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session.user} />

      {/* Hero */}
      {hero && (
        <section className="relative h-[70vh] md:h-[80vh] w-full">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${hero.backdropUrl || hero.posterUrl || ""})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="relative z-10 flex h-full items-end pb-20 px-4 md:px-12 max-w-2xl">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
                {hero.title}
              </h1>
              <p className="text-white/80 line-clamp-3 text-sm md:text-base">
                {hero.description}
              </p>
              <div className="flex gap-3">
                <Link href={hero.type === "SERIES" ? `/series/${hero.slug}` : `/movie/${hero.slug}`}>
                  <Button size="lg" className="gap-2">
                    <Play className="h-5 w-5 fill-current" /> Play
                  </Button>
                </Link>
                <Link href={hero.type === "SERIES" ? `/series/${hero.slug}` : `/movie/${hero.slug}`}>
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Info className="h-5 w-5" /> More Info
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="relative z-20 -mt-16 space-y-10">
        {continueItems.length > 0 && (
          <ContentRow title="Continue Watching" items={continueItems} />
        )}
        <ContentRow title="Recently Added" items={recent} />
        <ContentRow title="Popular Now" items={popular} />
      </div>
    </div>
  );
}
