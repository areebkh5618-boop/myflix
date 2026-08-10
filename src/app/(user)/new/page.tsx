import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import { MovieCard } from "@/components/movies/movie-card";
import { ContentRow } from "@/components/movies/content-row";

export default async function NewAndPopularPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [recent, popular, featured] = await Promise.all([
    prisma.content.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    prisma.content.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 24,
    }),
    prisma.content.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: { viewCount: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session.user} />
      <div className="pt-24 space-y-10">
        <div className="px-4 md:px-8">
          <h1 className="text-3xl font-bold mb-2">New & Popular</h1>
          <p className="text-white/60">Recently added and trending titles</p>
        </div>

        {featured.length > 0 && (
          <ContentRow title="Featured" items={featured} />
        )}
        <ContentRow title="Recently Added" items={recent} />
        <ContentRow title="Most Popular" items={popular} />

        <div className="px-4 md:px-8">
          <h2 className="text-xl font-semibold mb-4">All New Titles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recent.map((m) => (
              <MovieCard
                key={m.id}
                id={m.id}
                title={m.title}
                slug={m.slug}
                posterUrl={m.posterUrl}
                releaseYear={m.releaseYear}
                imdbRating={m.imdbRating}
                type={m.type}
              />
            ))}
          </div>
          {recent.length === 0 && (
            <p className="text-white/50">No content yet. Ask admin to add movies or series.</p>
          )}
        </div>
      </div>
    </div>
  );
}
