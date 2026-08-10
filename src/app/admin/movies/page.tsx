import prisma from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminMoviesPage() {
  const movies = await prisma.content.findMany({
    where: { type: "MOVIE" },
    orderBy: { createdAt: "desc" },
    include: { genres: { include: { genre: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Movies</h1>
        <Link href="/admin/movies/new">
          <Button>Add Movie</Button>
        </Link>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-white/60">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Year</th>
              <th className="p-3">Status</th>
              <th className="p-3">Views</th>
              <th className="p-3">Likes</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-3 font-medium">{m.title}</td>
                <td className="p-3">{m.releaseYear || "—"}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${m.status === "PUBLISHED" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {m.status}
                  </span>
                </td>
                <td className="p-3">{m.viewCount}</td>
                <td className="p-3">{m.likeCount}</td>
                <td className="p-3">
                  <Link href={`/admin/movies/${m.id}`} className="text-primary hover:underline text-xs">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {movies.length === 0 && (
          <p className="p-6 text-white/40 text-center">No movies yet. Add your first movie.</p>
        )}
      </div>
    </div>
  );
}
