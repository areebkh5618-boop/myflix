import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import { MovieCard } from "@/components/movies/movie-card";

export default async function MyListPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { content: true },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session.user} />
      <div className="pt-24 px-4 md:px-8">
        <h1 className="text-3xl font-bold mb-8">My List</h1>
        {items.length === 0 ? (
          <p className="text-white/50">Your list is empty. Browse and add titles you want to watch later.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <MovieCard
                key={item.id}
                id={item.content.id}
                title={item.content.title}
                slug={item.content.slug}
                posterUrl={item.content.posterUrl}
                releaseYear={item.content.releaseYear}
                imdbRating={item.content.imdbRating}
                type={item.content.type}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
