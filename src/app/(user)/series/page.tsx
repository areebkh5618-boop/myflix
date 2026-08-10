import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import { MovieCard } from "@/components/movies/movie-card";

export default async function SeriesPage() {
  const session = await auth();
  const items = await prisma.content.findMany({
    where: { status: "PUBLISHED", type: "SERIES" },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session?.user} />
      <div className="pt-24 px-4 md:px-8">
        <h1 className="text-3xl font-bold mb-8">Series</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((m) => (
            <MovieCard
              key={m.id}
              id={m.id}
              title={m.title}
              slug={m.slug}
              posterUrl={m.posterUrl}
              releaseYear={m.releaseYear}
              imdbRating={m.imdbRating}
              type="SERIES"
            />
          ))}
        </div>
        {items.length === 0 && <p className="text-white/50">No series available yet.</p>}
      </div>
    </div>
  );
}
