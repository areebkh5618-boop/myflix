# MyFlix — Free Full-Stack Streaming Platform

Netflix-style streaming app. Completely free. Strict USER / ADMIN separation.

## Features implemented

### Authentication & Security
- Sign up / Login / Logout
- bcrypt password hashing
- JWT sessions (Auth.js / NextAuth v5)
- Role-based access (USER | ADMIN)
- Middleware + server-side `requireUser()` / `requireAdmin()` on every sensitive API
- Change password (requires current password)
- Profile update (username uniqueness checked)

### User experience
- Landing page
- Browse (hero + Continue Watching + rows)
- Movies catalog & detail pages
- Series catalog & detail pages (seasons + episodes)
- Custom video player (play/pause/seek/volume/fullscreen/speed/keyboard shortcuts)
- Auto-save watch progress + resume
- Continue Watching
- Like / Unlike
- My List (wishlist)
- Watch History (clearable)
- Search (debounced)
- Profile & Settings
- Download (when enabled by admin)

### Admin panel
- Protected `/admin` dashboard with live stats
- Movies list + Add Movie form
- Series overview
- User management (enable/disable)
- Analytics (top viewed / liked)
- Audit log entries on admin actions

### Data model
Full Prisma schema: User, Content, Genre, Season, Episode, WatchProgress, WatchHistory, Like, WishlistItem, View, Download, AuditLog, SiteSettings.

## Quick start

```bash
cd myflix
cp .env.example .env
# Edit DATABASE_URL, AUTH_SECRET, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD

npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open http://localhost:3000

Admin login uses the credentials from `.env`.

## Important security rules enforced
- Normal users cannot reach `/admin` or `/api/admin/*` (403)
- Private data always uses `session.user.id` — never client-supplied user IDs
- Passwords never stored in plain text
- Only published content is visible to users
- Downloads only when `allowDownload` is true

## Project structure
```
src/app/(auth)     login, signup
src/app/(user)     browse, movies, series, watch, my-list, history, profile, settings, search
src/app/admin      dashboard, movies, series, users, analytics
src/app/api        auth, me/*, content, search, views, download, admin/*
src/components     player, movies, layout, ui, admin
src/lib            auth, db, permissions, validations, utils
prisma             schema + seed
```

## Demo content
Seed creates genres, sample movies, one series with 3 episodes (sample Big Buck Bunny video), and the admin account.

## Still optional / future polish
- Full season/episode admin CRUD UI (APIs structure ready)
- Cloudinary/S3 direct upload UI
- HLS multi-quality
- Charts (Recharts already in deps)
- Forgot-password email flow
- Avatar upload

The core streaming loop is fully functional end-to-end once the database is connected.
