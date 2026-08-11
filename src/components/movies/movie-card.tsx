"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  id: string;
  title: string;
  slug: string;
  posterUrl?: string | null;
  releaseYear?: number | null;
  imdbRating?: number | null;
  type?: string;
  progress?: number;
  className?: string;
}

export function MovieCard({
  id,
  title,
  slug,
  posterUrl,
  releaseYear,
  imdbRating,
  type = "MOVIE",
  progress,
  className,
}: MovieCardProps) {
  const href = type === "SERIES" ? `/series/${slug}` : `/movie/${slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group/card relative flex-shrink-0 w-[150px] md:w-[180px] lg:w-[200px]",
        className
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-card">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={title}
              className="h-full w-full object-cover transition duration-300 group-hover/card:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-card text-muted text-sm p-2 text-center">
            {title}
          </div>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 transition flex items-center justify-center group-hover/card:opacity-100">
          <div className="rounded-full bg-white p-2">
            <Play className="h-4 w-4 text-black fill-black" />
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="text-sm font-medium text-white line-clamp-1">{title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted">
          {releaseYear != null && <span>{releaseYear}</span>}
          {imdbRating != null && <span>★ {Number(imdbRating).toFixed(1)}</span>}
        </div>
      </div>
    </Link>
  );
}
