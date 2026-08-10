"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/movies/movie-card";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) setResults(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session?.user} />
      <div className="pt-24 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movies, series, actors..."
            className="pl-12 text-lg py-4"
            autoFocus
          />
        </div>
        {loading && <p className="text-white/50">Searching...</p>}
        {!loading && q.length >= 2 && results.length === 0 && (
          <p className="text-white/50">No results for &quot;{q}&quot;</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((item) => (
            <MovieCard
              key={item.id}
              id={item.id}
              title={item.title}
              slug={item.slug}
              posterUrl={item.posterUrl}
              releaseYear={item.releaseYear}
              imdbRating={item.imdbRating}
              type={item.type}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
