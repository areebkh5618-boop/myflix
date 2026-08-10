import prisma from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminSeriesPage() {
  const series = await prisma.content.findMany({
    where: { type: "SERIES" },
    orderBy: { createdAt: "desc" },
    include: {
      seasons: { include: { _count: { select: { episodes: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Series</h1>
        <Link href="/admin/series/new">
          <Button>Add Series</Button>
        </Link>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-white/60">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Seasons</th>
              <th className="p-3">Episodes</th>
              <th className="p-3">Status</th>
              <th className="p-3">Views</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-3 font-medium">{s.title}</td>
                <td className="p-3">{s.seasons.length}</td>
                <td className="p-3">
                  {s.seasons.reduce((acc, se) => acc + se._count.episodes, 0)}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      s.status === "PUBLISHED"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="p-3">{s.viewCount}</td>
                <td className="p-3">
                  <Link href={`/admin/series/${s.id}`} className="text-primary hover:underline text-xs">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {series.length === 0 && (
          <p className="p-6 text-center text-white/40">No series yet. Add your first series.</p>
        )}
      </div>
    </div>
  );
}
