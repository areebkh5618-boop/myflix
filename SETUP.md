# MyFlix — Setup Guide

## Requirements
- Node.js 18+
- PostgreSQL running locally
- npm

## 1. Install

```bash
cd myflix
npm install --legacy-peer-deps
```

## 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/myflix?schema=public"

# MUST be a real random string (not the placeholder)
AUTH_SECRET="your-generated-secret-here"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@myflix.com"
ADMIN_PASSWORD="Admin123!"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate AUTH_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Database

```bash
# Create database in PostgreSQL first:
# CREATE DATABASE myflix;

npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000

- Sign up a normal user, or
- Login as admin: admin@myflix.com / Admin123! (or whatever you set)

## Troubleshooting

### "no matching decryption secret"
- AUTH_SECRET is missing or was changed
- Clear browser cookies for localhost:3000
- Restart `npm run dev`

### /api/auth/session 404
```bash
rm -rf .next
npm run dev
```
Confirm file exists: `src/app/api/auth/[...nextauth]/route.ts`

### Seed failed
```bash
npx tsx prisma/seed.ts
```

### Login fails
- Ensure seed created the admin user
- Check email is lowercase
- Password must match ADMIN_PASSWORD from .env when seeding
