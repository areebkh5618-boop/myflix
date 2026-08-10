import { PrismaClient, Role, ContentType, ContentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@myflix.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log("Admin already exists");
  }

  // Genres
  const genreNames = [
    "Action", "Comedy", "Drama", "Horror", "Thriller", "Romance",
    "Documentary", "Sci-Fi", "Anime", "Adventure", "Fantasy", "Crime"
  ];

  for (const name of genreNames) {
    await prisma.genre.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  }
  console.log("Genres seeded");

  // Demo movies
  const action = await prisma.genre.findUnique({ where: { slug: "action" } });
  const scifi = await prisma.genre.findUnique({ where: { slug: "sci-fi" } });
  const drama = await prisma.genre.findUnique({ where: { slug: "drama" } });

  const demoMovies = [
    {
      title: "Cosmic Horizon",
      slug: "cosmic-horizon",
      description: "A team of explorers discovers a mysterious signal from the edge of the galaxy that could change humanity forever.",
      type: ContentType.MOVIE,
      status: ContentStatus.PUBLISHED,
      releaseYear: 2024,
      duration: 142,
      maturityRating: "PG-13",
      imdbRating: 8.2,
      language: "English",
      director: "Alex Rivera",
      cast: ["Jordan Lee", "Sam Patel", "Morgan Quinn"],
      posterUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400",
      backdropUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200",
      allowDownload: true,
      isFeatured: true,
      publishedAt: new Date(),
    },
    {
      title: "Shadow Protocol",
      slug: "shadow-protocol",
      description: "An elite agent must stop a global conspiracy before time runs out.",
      type: ContentType.MOVIE,
      status: ContentStatus.PUBLISHED,
      releaseYear: 2023,
      duration: 118,
      maturityRating: "R",
      imdbRating: 7.6,
      language: "English",
      director: "Chris Nolan",
      cast: ["Emma Stone", "Idris Elba"],
      posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400",
      backdropUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200",
      allowDownload: false,
      isFeatured: true,
      publishedAt: new Date(),
    },
    {
      title: "Quiet Waters",
      slug: "quiet-waters",
      description: "A touching drama about family, loss, and finding hope in unexpected places.",
      type: ContentType.MOVIE,
      status: ContentStatus.PUBLISHED,
      releaseYear: 2022,
      duration: 105,
      maturityRating: "PG",
      imdbRating: 7.9,
      language: "English",
      director: "Sofia Chen",
      cast: ["Laura Harrier", "John Cho"],
      posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400",
      backdropUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
      allowDownload: true,
      isFeatured: false,
      publishedAt: new Date(),
    },
  ];

  for (const movie of demoMovies) {
    const existing = await prisma.content.findUnique({ where: { slug: movie.slug } });
    if (!existing) {
      const created = await prisma.content.create({ data: movie });
      if (action && (movie.slug === "cosmic-horizon" || movie.slug === "shadow-protocol")) {
        await prisma.contentGenre.create({ data: { contentId: created.id, genreId: action.id } });
      }
      if (scifi && movie.slug === "cosmic-horizon") {
        await prisma.contentGenre.create({ data: { contentId: created.id, genreId: scifi.id } });
      }
      if (drama && movie.slug === "quiet-waters") {
        await prisma.contentGenre.create({ data: { contentId: created.id, genreId: drama.id } });
      }
      console.log(`Movie created: ${movie.title}`);
    }
  }

  // Demo series
  const existingSeries = await prisma.content.findUnique({ where: { slug: "neon-city" } });
  if (!existingSeries) {
    const series = await prisma.content.create({
      data: {
        title: "Neon City",
        slug: "neon-city",
        description: "In a cyberpunk metropolis, a detective uncovers a conspiracy that spans the digital and physical worlds.",
        type: ContentType.SERIES,
        status: ContentStatus.PUBLISHED,
        releaseYear: 2024,
        maturityRating: "TV-MA",
        imdbRating: 8.5,
        language: "English",
        director: "Various",
        cast: ["Zendaya", "Dev Patel", "Rami Malek"],
        posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400",
        backdropUrl: "https://images.unsplash.com/photo-1550745165-9bc8b375bee4?w=1200",
        isFeatured: true,
        publishedAt: new Date(),
      },
    });

    if (scifi) {
      await prisma.contentGenre.create({ data: { contentId: series.id, genreId: scifi.id } });
    }
    if (action) {
      await prisma.contentGenre.create({ data: { contentId: series.id, genreId: action.id } });
    }

    const season1 = await prisma.season.create({
      data: {
        contentId: series.id,
        seasonNumber: 1,
        title: "Season 1",
        releaseYear: 2024,
      },
    });

    const episodes = [
      { episodeNumber: 1, title: "Signal", description: "A mysterious signal appears in the network.", duration: 52 },
      { episodeNumber: 2, title: "Ghost Protocol", description: "The team goes underground.", duration: 48 },
      { episodeNumber: 3, title: "Mirror", description: "Identity becomes fluid.", duration: 55 },
    ];

    for (const ep of episodes) {
      await prisma.episode.create({
        data: {
          seasonId: season1.id,
          ...ep,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          allowDownload: true,
        },
      });
    }
    console.log("Series Neon City created with Season 1 and 3 episodes");
  }

  // Site settings
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    await prisma.siteSettings.create({
      data: {
        siteName: "MyFlix",
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
