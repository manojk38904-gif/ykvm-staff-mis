"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <img src="/ykvm-logo.png" alt="YKVM" className="h-8 w-auto" />
              <h1 className="text-xl font-bold text-gray-900">YKVM Staff MIS</h1>
            </div>
            <div className="flex items-center space-x-4">
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Attendance"
              description="Mark daily attendance with selfie and GPS verification"
              icon="📋"
            />
            <DashboardCard
              title="Field Trips"
              description="Start and manage field trips with location tracking"
              icon="🗺️"
            />
            <DashboardCard
              title="Leave Management"
              description="Apply for leave and view leave balance"
              icon="📅"
            />
            <DashboardCard
              title="Activities"
              description="Record field activities with photos and reports"
              icon="📸"
            />
            <DashboardCard
              title="Payroll"
              description="View salary slips and payment history"
              icon="💰"
            />
            <DashboardCard
              title="Profile"
              description="View and update your staff profile"
              icon="👤"
            />
          </div>

          {(user?.role === "ADMIN" || user?.role === "SUB_ADMIN") && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Administration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                  title="Staff Management"
                  description="Manage staff enrollment, profiles and documents"
                  icon="👥"
                />
                <DashboardCard
                  title="Office Locations"
                  description="Configure office locations and geofence radius"
                  icon="📍"
                />
                <DashboardCard
                  title="Reports & Registers"
                  description="Download movement registers, TA registers and reports"
                  icon="📊"
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
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
