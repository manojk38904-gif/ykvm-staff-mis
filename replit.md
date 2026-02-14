# YKVM Staff MIS

## Overview
Staff Management Information System for Yuva Kaushal Vikas Mandal (YKVM). A Progressive Web App built with Next.js that enables administrators and staff to manage the employee lifecycle - from onboarding to attendance, field reporting, leaves, payroll and travel allowances.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **Database**: PostgreSQL via Prisma ORM (v5)
- **Authentication**: NextAuth.js with Google OAuth (Admin/Sub-Admin) + Credentials provider
- **PDF Generation**: PDFKit + qrcode
- **Storage**: Local filesystem adapter (configurable for S3)

## Project Structure
```
src/
  app/
    api/
      auth/[...nextauth]/route.ts     - NextAuth API route
      admin/sub-admins/route.ts       - Sub-Admin management API (ADMIN only)
      attendance/route.ts             - Attendance submission API
      activity/route.ts               - Activity management API
    dashboard/
      page.tsx                        - Dashboard page with social links
      sub-admins/page.tsx             - Sub-Admin management page (ADMIN only)
    layout.tsx                        - Root layout with SessionProvider
    page.tsx                          - Login page (Google + credentials)
    providers.tsx                     - Client-side providers (SessionProvider)
    manifest.ts                      - PWA manifest
    globals.css                      - Global styles
  lib/
    auth.ts                           - NextAuth config (Google + Credentials)
    geo.ts                            - Haversine distance formula
    prisma.ts                         - Prisma client singleton
    storage.ts                        - File storage adapter
prisma/
  schema.prisma                       - Database schema
  seed.ts                             - Database seeding script
```

## Running the App
- Dev: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Start: `npm start` (runs on port 5000)

## Authentication
- **Admin/Sub-Admin**: Can login via Google OAuth or credentials
- **Staff**: Login via credentials only
- Google OAuth only allows users with ADMIN or SUB_ADMIN role in the database
- Main Admin can create Sub-Admin accounts via `/dashboard/sub-admins`

## Default Admin Credentials
- Email: admin@ykvm.local
- Password: admin123

## Key Configuration
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption
- `NEXTAUTH_URL`: Base URL for NextAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID (required for Google login)
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret (required for Google login)
- Next.js configured with `allowedDevOrigins` for Replit proxy compatibility

## Social Media Links
- YouTube: https://www.youtube.com/channel/UC_R1U7XAKORvQ8Ya4qWFvyw
- Instagram: https://www.instagram.com/yuvakaushalvikasmandal
- Facebook: https://www.facebook.com/profile.php?id=100095365659399
- LinkedIn: https://www.linkedin.com/in/yuva-kaushal-vikas-mandal-b018712a7

## Recent Changes
- 2026-02-14: Added Google OAuth for Admin/Sub-Admin login, Sub-Admin management page, updated YKVM logo, added social media links
- 2026-02-14: Initial Replit setup - fixed Prisma schema relations, created missing Next.js pages (login, dashboard), configured for Replit environment (port 5000, allowed origins, Tailwind v4 PostCSS)
