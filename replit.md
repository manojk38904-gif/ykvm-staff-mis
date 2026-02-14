# YKVM Staff MIS

## Overview
Staff Management Information System for Yuva Kaushal Vikas Mandal (YKVM). A Progressive Web App built with Next.js that enables administrators and staff to manage the employee lifecycle - from onboarding to attendance, field reporting, leaves, payroll and travel allowances.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **Database**: PostgreSQL via Prisma ORM (v5)
- **Authentication**: NextAuth.js with credentials provider
- **PDF Generation**: PDFKit + qrcode
- **Storage**: Local filesystem adapter (configurable for S3)

## Project Structure
```
src/
  app/
    api/
      auth/[...nextauth]/route.ts  - NextAuth API route
      attendance/route.ts          - Attendance submission API
      activity/route.ts            - Activity management API
    dashboard/page.tsx             - Dashboard page
    layout.tsx                     - Root layout with SessionProvider
    page.tsx                       - Login page
    providers.tsx                  - Client-side providers (SessionProvider)
    manifest.ts                    - PWA manifest
    globals.css                    - Global styles
  lib/
    auth.ts                        - NextAuth configuration
    geo.ts                         - Haversine distance formula
    prisma.ts                      - Prisma client singleton
    storage.ts                     - File storage adapter
prisma/
  schema.prisma                    - Database schema
  seed.ts                          - Database seeding script
```

## Running the App
- Dev: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Start: `npm start` (runs on port 5000)

## Default Admin Credentials
- Email: admin@ykvm.local
- Password: admin123

## Key Configuration
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption
- `NEXTAUTH_URL`: Base URL for NextAuth
- Next.js configured with `allowedDevOrigins` for Replit proxy compatibility

## Recent Changes
- 2026-02-14: Initial Replit setup - fixed Prisma schema relations, created missing Next.js pages (login, dashboard), configured for Replit environment (port 5000, allowed origins, Tailwind v4 PostCSS)
