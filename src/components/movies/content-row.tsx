"use client";

import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./movie-card";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  posterUrl?: string | null;
  releaseYear?: number | null;
  imdbRating?: number | null;
  type?: string;
  progressPercentage?: number;
}

interface ContentRowProps {
  title: string;
  items: ContentItem[];
}

export function ContentRow({ title, items }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const uniqueItems = useMemo(
    () =>
      Array.from(
        new Map(items.map((item) => [item.id, item])).values()
      ),
    [items]
  );

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;

    const amount = dir === "left" ? -600 : 600;

    rowRef.current.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  if (uniqueItems.length === 0) return null;

  return (
    <section className="space-y-3 px-4 md:px-8">
      <h2 className="text-xl font-semibold text-white md:text-2xl">
        {title}
      </h2>

      <div className="group/row relative">
        <button
          type="button"
          aria-label={`Scroll ${title} left`}
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 hidden h-full -translate-y-1/2 items-center bg-black/50 px-2 opacity-0 transition group-hover/row:flex group-hover/row:opacity-100"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>

        <div
          ref={rowRef}
          className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-2"
        >
          {uniqueItems.map((item) => (
            <MovieCard
              key={item.id}
              id={item.id}
              title={item.title}
              slug={item.slug}
              posterUrl={item.posterUrl}
              releaseYear={item.releaseYear}
              imdbRating={item.imdbRating}
              type={item.type}
              progress={item.progressPercentage}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label={`Scroll ${title} right`}
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 hidden h-full -translate-y-1/2 items-center bg-black/50 px-2 opacity-0 transition group-hover/row:flex group-hover/row:opacity-100"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      </div>
    </section>
  );
}