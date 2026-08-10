import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db";
import { VideoPlayer } from "@/components/player/video-player";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ episode?: string }>;
}

export default async function WatchPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?message=Please sign in to start watching.");
  }

  const { id } = await params;
  const { episode: episodeId } = await searchParams;

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
      },
    },
  });

  if (!content || content.status !== "PUBLISHED") notFound();

  let videoUrl = content.videoUrl;
  let title = content.title;
  let poster = content.backdropUrl || content.posterUrl;
  let currentEpisode = null;
  let nextEpisode = null;
  let prevEpisode = null;

  if (content.type === "SERIES" && episodeId) {
    for (const season of content.seasons) {
      for (let i = 0; i < season.episodes.length; i++) {
        const ep = season.episodes[i];
        if (ep.id === episodeId) {
          currentEpisode = ep;
          videoUrl = ep.videoUrl;
          title = `${content.title} — S${season.seasonNumber}E${ep.episodeNumber}: ${ep.title}`;
          poster = ep.thumbnailUrl || poster;
          if (i > 0) prevEpisode = season.episodes[i - 1];
          if (i < season.episodes.length - 1) nextEpisode = season.episodes[i + 1];
          // also check next season
          if (!nextEpisode) {
            const nextSeason = content.seasons.find((s) => s.seasonNumber === season.seasonNumber + 1);
            if (nextSeason?.episodes[0]) nextEpisode = nextSeason.episodes[0];
          }
          break;
        }
      }
    }
  }

  if (!videoUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p>No video available for this title yet.</p>
          <Link href={content.type === "SERIES" ? `/series/${content.slug}` : `/movie/${content.slug}`} className="text-primary underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  // Load progress
  const progress = await prisma.watchProgress.findFirst({
    where: {
      userId: session.user.id,
      contentId: content.id,
      episodeId: episodeId || null,
    },
  });

  // Register view
  await prisma.view.create({
    data: {
      userId: session.user.id,
      contentId: content.id,
      episodeId: episodeId || null,
    },
  }).catch(() => {});
  await prisma.content.update({
    where: { id: content.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent">
        <Link
          href={content.type === "SERIES" ? `/series/${content.slug}` : `/movie/${content.slug}`}
          className="flex items-center gap-1 text-white/80 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" /> Back
        </Link>
        <h1 className="text-lg font-medium truncate">{title}</h1>
      </div>

      <div className="pt-14">
        <VideoPlayer
          src={videoUrl}
          poster={poster}
          title={title}
          contentId={content.id}
          episodeId={episodeId || null}
          initialTime={progress && !progress.completed ? progress.currentTime : 0}
        />
      </div>

      {content.type === "SERIES" && currentEpisode && (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <h2 className="text-xl font-semibold">{currentEpisode.title}</h2>
          {currentEpisode.description && (
            <p className="text-white/70 text-sm">{currentEpisode.description}</p>
          )}
          <div className="flex gap-3">
            {prevEpisode && (
              <Link
                href={`/watch/${content.id}?episode=${prevEpisode.id}`}
                className="rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                ← Previous
              </Link>
            )}
            {nextEpisode && (
              <Link
                href={`/watch/${content.id}?episode=${nextEpisode.id}`}
                className="rounded bg-primary px-4 py-2 text-sm hover:bg-primary-hover"
              >
                Next Episode →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
