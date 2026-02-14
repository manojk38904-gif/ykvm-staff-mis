"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import Link from "next/link";

const socialLinks = {
  youtube: "https://www.youtube.com/channel/UC_R1U7XAKORvQ8Ya4qWFvyw",
  instagram: "https://www.instagram.com/yuvakaushalvikasmandal",
  facebook: "https://www.facebook.com/profile.php?id=100095365659399",
  linkedin: "https://www.linkedin.com/in/yuva-kaushal-vikas-mandal-b018712a7",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <img src="/ykvm-logo.png" alt="YKVM" className="h-10 w-auto" />
              <h1 className="text-xl font-bold text-gray-900">YKVM Staff MIS</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.image && (
                <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
              )}
              <span className="text-sm text-gray-600">
                {user?.name || user?.email}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-1">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/attendance">
              <DashboardCard
                title="Attendance"
                description="Mark daily attendance with selfie and GPS verification"
                icon="📋"
                href="/dashboard/attendance"
              />
            </Link>
            <Link href="/dashboard/field-trips">
              <DashboardCard
                title="Field Trips"
                description="Start and manage field trips with location tracking"
                icon="🗺️"
                href="/dashboard/field-trips"
              />
            </Link>
            <Link href="/dashboard/leaves">
              <DashboardCard
                title="Leave Management"
                description="Apply for leave and view leave balance"
                icon="📅"
                href="/dashboard/leaves"
              />
            </Link>
            <Link href="/dashboard/activities">
              <DashboardCard
                title="Activities"
                description="Record field activities with photos and reports"
                icon="📸"
                href="/dashboard/activities"
              />
            </Link>
            <Link href="/dashboard/payroll">
              <DashboardCard
                title="Payroll"
                description="View salary slips and payment history"
                icon="💰"
                href="/dashboard/payroll"
              />
            </Link>
            <Link href="/dashboard/profile">
              <DashboardCard
                title="Profile"
                description="View and update your staff profile"
                icon="👤"
                href="/dashboard/profile"
              />
            </Link>
          </div>

          {user?.role === "ADMIN" && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Administration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/sub-admins">
                  <DashboardCard
                    title="Sub-Admin Management"
                    description="Create and manage Sub-Admin accounts"
                    icon="🛡️"
                    href="/dashboard/sub-admins"
                  />
                </Link>
                <Link href="/dashboard/staff">
                  <DashboardCard
                    title="Staff Management"
                    description="Manage staff enrollment, profiles and documents"
                    icon="👥"
                    href="/dashboard/staff"
                  />
                </Link>
                <Link href="/dashboard/locations">
                  <DashboardCard
                    title="Office Locations"
                    description="Configure office locations and geofence radius"
                    icon="📍"
                    href="/dashboard/locations"
                  />
                </Link>
                <Link href="/dashboard/reports">
                  <DashboardCard
                    title="Reports & Registers"
                    description="Download movement registers, TA registers and reports"
                    icon="📊"
                    href="/dashboard/reports"
                  />
                </Link>
              </div>
            </div>
          )}

          {user?.role === "SUB_ADMIN" && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Administration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/staff">
                  <DashboardCard
                    title="Staff Management"
                    description="Manage staff enrollment, profiles and documents"
                    icon="👥"
                    href="/dashboard/staff"
                  />
                </Link>
                <Link href="/dashboard/locations">
                  <DashboardCard
                    title="Office Locations"
                    description="Configure office locations and geofence radius"
                    icon="📍"
                    href="/dashboard/locations"
                  />
                </Link>
                <Link href="/dashboard/reports">
                  <DashboardCard
                    title="Reports & Registers"
                    description="Download movement registers, TA registers and reports"
                    icon="📊"
                    href="/dashboard/reports"
                  />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">Yuva Kaushal Vikas Mandal</p>
            <div className="flex space-x-4">
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" title="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors" title="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors" title="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href?: string;
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
      <div className="p-5">
        <div className="flex items-center">
          <div className="text-3xl mr-3">{icon}</div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
