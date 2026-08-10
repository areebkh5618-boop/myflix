import prisma from "@/lib/db";

export default async function AnalyticsPage() {
  const [topViewed, topLiked, recentViews] = await Promise.all([
    prisma.content.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: { title: true, type: true, viewCount: true, likeCount: true },
    }),
    prisma.content.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { likeCount: "desc" },
      take: 10,
      select: { title: true, type: true, likeCount: true, viewCount: true },
    }),
    prisma.view.count({
      where: { viewedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/60">Views (7 days)</p>
          <p className="text-3xl font-bold mt-1">{recentViews}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Most Viewed</h2>
          <div className="space-y-2">
            {topViewed.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{c.title} <span className="text-white/40 text-xs">{c.type}</span></span>
                <span className="text-white/60">{c.viewCount}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Most Liked</h2>
          <div className="space-y-2">
            {topLiked.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{c.title}</span>
                <span className="text-white/60">{c.likeCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
