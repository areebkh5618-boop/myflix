import prisma from "@/lib/db";
import { Users, Film, Tv, Eye, ThumbsUp, Download } from "lucide-react";

async function getStats() {
  const [
    totalUsers,
    totalMovies,
    totalSeries,
    totalEpisodes,
    totalViews,
    totalLikes,
    totalDownloads,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.content.count({ where: { type: "MOVIE" } }),
    prisma.content.count({ where: { type: "SERIES" } }),
    prisma.episode.count(),
    prisma.view.count(),
    prisma.like.count(),
    prisma.download.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const topContent = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: 5,
    select: { title: true, viewCount: true, likeCount: true, type: true },
  });

  return {
    totalUsers,
    totalMovies,
    totalSeries,
    totalEpisodes,
    totalViews,
    totalLikes,
    totalDownloads,
    recentUsers,
    topContent,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Movies", value: stats.totalMovies, icon: Film, color: "text-purple-400" },
    { label: "Series", value: stats.totalSeries, icon: Tv, color: "text-green-400" },
    { label: "Episodes", value: stats.totalEpisodes, icon: Tv, color: "text-teal-400" },
    { label: "Total Views", value: stats.totalViews, icon: Eye, color: "text-yellow-400" },
    { label: "Likes", value: stats.totalLikes, icon: ThumbsUp, color: "text-pink-400" },
    { label: "Downloads", value: stats.totalDownloads, icon: Download, color: "text-orange-400" },
    { label: "New Users (7d)", value: stats.recentUsers, icon: Users, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-white/60 mt-1">Overview of your MyFlix platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">Top Content by Views</h2>
        <div className="space-y-3">
          {stats.topContent.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <span className="font-medium">{item.title}</span>
                <span className="ml-2 text-xs text-white/40 uppercase">{item.type}</span>
              </div>
              <div className="text-sm text-white/60">
                {item.viewCount} views · {item.likeCount} likes
              </div>
            </div>
          ))}
          {stats.topContent.length === 0 && (
            <p className="text-white/40 text-sm">No content yet. Add movies or series to see stats.</p>
          )}
        </div>
      </div>
    </div>
  );
}
