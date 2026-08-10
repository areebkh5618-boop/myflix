import { z } from "zod";

/** Accept full URL, relative /uploads path, or empty */
const mediaUrl = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .refine(
    (v) =>
      v == null ||
      v.startsWith("/") ||
      v.startsWith("http://") ||
      v.startsWith("https://"),
    { message: "Must be a valid URL or /uploads/... path" }
  );

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, schema.optional().nullable());

export const movieSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  releaseYear: optionalNumber(z.number().int().min(1900).max(2100)),
  duration: optionalNumber(z.number().int().positive()),
  maturityRating: z.string().optional().nullable(),
  imdbRating: optionalNumber(z.number().min(0).max(10)),
  language: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  director: z.string().optional().nullable(),
  cast: z.array(z.string()).optional().default([]),
  posterUrl: mediaUrl,
  backdropUrl: mediaUrl,
  trailerUrl: mediaUrl,
  videoUrl: mediaUrl,
  allowDownload: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  genreIds: z.array(z.string()).optional().default([]),
});

export const seriesSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  releaseYear: optionalNumber(z.number().int().min(1900).max(2100)),
  maturityRating: z.string().optional().nullable(),
  imdbRating: optionalNumber(z.number().min(0).max(10)),
  language: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  director: z.string().optional().nullable(),
  cast: z.array(z.string()).optional().default([]),
  posterUrl: mediaUrl,
  backdropUrl: mediaUrl,
  trailerUrl: mediaUrl,
  allowDownload: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  genreIds: z.array(z.string()).optional().default([]),
});

export const seasonSchema = z.object({
  contentId: z.string().min(1),
  seasonNumber: optionalNumber(z.number().int().positive()),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  posterUrl: mediaUrl,
  releaseYear: optionalNumber(z.number().int().min(1900).max(2100)),
});

export const episodeSchema = z.object({
  seasonId: z.string().min(1),
  episodeNumber: optionalNumber(z.number().int().positive()),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  duration: optionalNumber(z.number().int().positive()),
  thumbnailUrl: mediaUrl,
  videoUrl: mediaUrl,
  allowDownload: z.boolean().default(false),
  releaseDate: z.string().datetime().optional().nullable(),
});

export const progressSchema = z.object({
  contentId: z.string().min(1),
  episodeId: z.string().optional().nullable(),
  currentTime: optionalNumber(z.number().min(0)),
  duration: optionalNumber(z.number().min(0)),
});

export type MovieInput = z.infer<typeof movieSchema>;
export type SeriesInput = z.infer<typeof seriesSchema>;
export type SeasonInput = z.infer<typeof seasonSchema>;
export type EpisodeInput = z.infer<typeof episodeSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
