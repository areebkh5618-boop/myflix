import Link from "next/link";
import { redirect } from "next/navigation";
import { Info, Play } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { ContentRow } from "@/components/movies/content-row";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export default async function BrowsePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [featured, recent, popular, continueWatching] = await Promise.all([
    prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        isFeatured: true,
      },
      take: 1,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    }),

    prisma.content.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    }),

    prisma.content.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        viewCount: "desc",
      },
      take: 12,
    }),

    prisma.watchProgress.findMany({
      where: {
        userId: session.user.id,
        completed: false,
        progressPercentage: {
          gte: 5,
          lt: 90,
        },
      },
      orderBy: {
        lastWatchedAt: "desc",
      },
      take: 10,
      include: {
        content: true,
        episode: {
          include: {
            season: true,
          },
        },
      },
    }),
  ]);

  const hero = featured[0] ?? recent[0];

  const continueItems = continueWatching.map((progress) => {
    const episode = progress.episode;

    const episodeTitle = episode
      ? `${progress.content.title} S${
          episode.season?.seasonNumber ?? "?"
        }E${episode.episodeNumber}`
      : progress.content.title;

    return {
      id: progress.content.id,
      title: episodeTitle,
      slug: progress.content.slug,
      posterUrl: progress.content.posterUrl,
      releaseYear: progress.content.releaseYear,
      imdbRating: progress.content.imdbRating,
      type: progress.content.type,
      progressPercentage: progress.progressPercentage,
    };
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {hero && (
        <section className="relative h-[70vh] w-full md:h-[80vh]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                hero.backdropUrl ?? hero.posterUrl ?? ""
              })`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          <div className="relative z-10 flex h-full max-w-2xl items-end px-4 pb-20 md:px-12">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white drop-shadow-lg md:text-6xl">
                {hero.title}
              </h1>

              {hero.description && (
                <p className="line-clamp-3 text-sm text-white/80 md:text-base">
                  {hero.description}
                </p>
              )}

              <div className="flex gap-3">
                <Link
                  href={
                    hero.type === "SERIES"
                      ? `/series/${hero.slug}`
                      : `/movie/${hero.slug}`
                  }
                >
                  <Button size="lg" className="gap-2">
                    <Play className="h-5 w-5 fill-current" />
                    Play
                  </Button>
                </Link>

                <Link
                  href={
                    hero.type === "SERIES"
                      ? `/series/${hero.slug}`
                      : `/movie/${hero.slug}`
                  }
                >
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Info className="h-5 w-5" />
                    More Info
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="relative z-20 -mt-16 space-y-10">
        {continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueItems}
          />
        )}

        <ContentRow title="Recently Added" items={recent} />

        <ContentRow title="Popular Now" items={popular} />
      </div>
    </div>
  );
}