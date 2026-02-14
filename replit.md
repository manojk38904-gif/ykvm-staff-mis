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
      admin/
        sub-admins/route.ts           - Sub-Admin management API (ADMIN only)
        staff/route.ts                - Staff CRUD API (ADMIN/SUB_ADMIN)
        locations/route.ts            - Office locations API (ADMIN/SUB_ADMIN)
        reports/route.ts              - Reports & registers API (ADMIN/SUB_ADMIN)
      attendance/route.ts             - Attendance GET/POST API
      activity/route.ts               - Activity management API
      field-trips/route.ts            - Field trips GET/POST/PATCH API
      leaves/route.ts                 - Leave GET/POST/PATCH API
      payroll/route.ts                - Payroll GET/POST/PATCH API
      profile/route.ts                - User profile GET/PUT API
    dashboard/
      page.tsx                        - Dashboard page with feature cards
      attendance/page.tsx             - Attendance marking (selfie + GPS)
      field-trips/page.tsx            - Field trip management
      leaves/page.tsx                 - Leave application & management
      activities/page.tsx             - Field activity recording
      payroll/page.tsx                - Payroll & salary management
      profile/page.tsx                - User profile view/edit
      sub-admins/page.tsx             - Sub-Admin management (ADMIN only)
      staff/page.tsx                  - Staff enrollment & management (ADMIN/SUB_ADMIN)
      locations/page.tsx              - Office location management (ADMIN/SUB_ADMIN)
      reports/page.tsx                - Reports & registers with CSV export (ADMIN/SUB_ADMIN)
    layout.tsx                        - Root layout with SessionProvider
    page.tsx                          - Login page (Google + credentials)
    providers.tsx                     - Client-side providers (SessionProvider)
    manifest.ts                       - PWA manifest
    globals.css                       - Global styles
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
- Main Admin (manojk38904@gmail.com) auto-provisioned as ADMIN on first Google login
- Main Admin can create Sub-Admin accounts via `/dashboard/sub-admins`

## Default Admin Credentials
- Email: admin@ykvm.local
- Password: admin123

## User Roles
- **ADMIN**: Full access to all features including staff/sub-admin management, payroll, reports
- **SUB_ADMIN**: Access to staff management, office locations, reports (no sub-admin management)
- **STAFF**: Attendance, field trips, activities, leave applications, profile, payroll view
- **APPROVER1/APPROVER2**: Leave approval workflow levels

## Feature Pages
- `/dashboard/attendance` - Mark attendance with selfie camera + GPS verification
- `/dashboard/field-trips` - Start/end field trips with GPS tracking
- `/dashboard/leaves` - Apply for leave (STAFF) / Approve/reject (ADMIN)
- `/dashboard/activities` - Record field activities with photos during trips
- `/dashboard/payroll` - View salary slips (STAFF) / Generate payroll (ADMIN)
- `/dashboard/profile` - View and update personal profile
- `/dashboard/staff` - Enroll and manage staff members (ADMIN/SUB_ADMIN)
- `/dashboard/locations` - Configure office locations with geofence radius (ADMIN/SUB_ADMIN)
- `/dashboard/reports` - Generate and download CSV reports (ADMIN/SUB_ADMIN)
- `/dashboard/sub-admins` - Create/manage Sub-Admin accounts (ADMIN only)

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
- 2026-02-15: Built all feature pages and APIs - Attendance (selfie+GPS), Field Trips, Leave Management, Activities, Payroll, Profile, Staff Management, Office Locations, Reports with CSV export
- 2026-02-14: Added Google OAuth for Admin/Sub-Admin login, Sub-Admin management page, updated YKVM logo, added social media links
- 2026-02-14: Initial Replit setup - fixed Prisma schema relations, created missing Next.js pages (login, dashboard), configured for Replit environment (port 5000, allowed origins, Tailwind v4 PostCSS)
