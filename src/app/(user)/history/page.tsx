import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import { ClearHistoryButton } from "@/components/movies/clear-history-button";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await prisma.watchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
    take: 50,
    include: {
      content: true,
      episode: { include: { season: true } },
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session.user} />
      <div className="pt-24 px-4 md:px-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Watch History</h1>
          {items.length > 0 && <ClearHistoryButton />}
        </div>
        {items.length === 0 ? (
          <p className="text-white/50">No watch history yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={
                  item.content.type === "SERIES" && item.episode
                    ? `/watch/${item.content.id}?episode=${item.episode.id}`
                    : item.content.type === "SERIES"
                    ? `/series/${item.content.slug}`
                    : `/movie/${item.content.slug}`
                }
                className="flex gap-4 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition"
              >
                <div className="w-20 h-28 rounded overflow-hidden bg-card flex-shrink-0">
                  {item.content.posterUrl && (
                    <img src={item.content.posterUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{item.content.title}</h3>
                  {item.episode && (
                    <p className="text-sm text-white/60">
                      S{item.episode.season?.seasonNumber}E{item.episode.episodeNumber}: {item.episode.title}
                    </p>
                  )}
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(item.watchedAt).toLocaleString()}
                    {item.completed ? " · Completed" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
