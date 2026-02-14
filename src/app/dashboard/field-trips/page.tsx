"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FieldTrip {
  id: string;
  staffId: string;
  startTime: string;
  endTime: string | null;
  startLat: string | number;
  startLng: string | number;
  endLat: string | number | null;
  endLng: string | number | null;
  status: "ONGOING" | "COMPLETED" | "CANCELLED";
  startOdometer: number | null;
  endOdometer: number | null;
  computedKm: number | null;
  staff?: {
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  };
}

export default function FieldTripsPage() {
  const { data: session, status } = useSession();
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = session?.user as any;
  const isStaff = user?.role === "STAFF";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      fetchFieldTrips();
    }
  }, [status]);

  const fetchFieldTrips = async () => {
    try {
      const res = await fetch("/api/field-trips");
      const data = await res.json();
      setFieldTrips(data.fieldTrips || []);
    } catch {
      setError("Failed to load field trips");
    } finally {
      setLoading(false);
    }
  };

  const ongoingTrip = fieldTrips.find((t) => t.status === "ONGOING");
  const pastTrips = fieldTrips.filter((t) => t.status !== "ONGOING");

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  };

  const handleStartTrip = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const position = await getCurrentPosition();
      const startLat = position.coords.latitude;
      const startLng = position.coords.longitude;

      const res = await fetch("/api/field-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat: parseFloat(String(startLat)),
          startLng: parseFloat(String(startLng)),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start field trip");
      } else {
        setSuccess("Field trip started successfully!");
        fetchFieldTrips();
      }
    } catch (err: any) {
      if (err?.code === 1) {
        setError("Location permission denied. Please enable GPS access.");
      } else if (err?.code === 2) {
        setError("Location unavailable. Please try again.");
      } else if (err?.code === 3) {
        setError("Location request timed out. Please try again.");
      } else {
        setError(err?.message || "Failed to start field trip");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!ongoingTrip) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const position = await getCurrentPosition();
      const endLat = position.coords.latitude;
      const endLng = position.coords.longitude;

      const res = await fetch("/api/field-trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldTripId: ongoingTrip.id,
          endLat: parseFloat(String(endLat)),
          endLng: parseFloat(String(endLng)),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to end field trip");
      } else {
        setSuccess("Field trip ended successfully!");
        fetchFieldTrips();
      }
    } catch (err: any) {
      if (err?.code === 1) {
        setError("Location permission denied. Please enable GPS access.");
      } else {
        setError(err?.message || "Failed to end field trip");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ONGOING: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <img src="/ykvm-logo.png" alt="YKVM" className="h-10 w-auto" />
              <h1 className="text-xl font-bold text-gray-900">YKVM Staff MIS</h1>
            </div>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Field Trips</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {isStaff && (
          <>
            <div className="mb-6">
              {ongoingTrip ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Ongoing Field Trip</h3>
                    {getStatusBadge("ONGOING")}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Started</p>
                      <p className="font-medium text-gray-900">{formatDate(ongoingTrip.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Start Location</p>
                      <p className="font-medium text-gray-900">
                        {parseFloat(String(ongoingTrip.startLat)).toFixed(6)}, {parseFloat(String(ongoingTrip.startLng)).toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEndTrip}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? "Ending Trip..." : "End Field Trip"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartTrip}
                  disabled={actionLoading}
                  className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? "Getting Location..." : "Start Field Trip"}
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">Past Trips ({pastTrips.length})</h3>
              </div>
              {pastTrips.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No past field trips found.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {pastTrips.map((trip) => (
                    <li key={trip.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{formatDate(trip.startTime)}</p>
                        {getStatusBadge(trip.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                        {trip.endTime && (
                          <div>
                            <span className="text-gray-400">Ended:</span> {formatDate(trip.endTime)}
                          </div>
                        )}
                        {trip.computedKm != null && (
                          <div>
                            <span className="text-gray-400">Distance:</span> {trip.computedKm.toFixed(2)} km
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {isAdmin && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">All Field Trips ({fieldTrips.length})</h3>
            </div>
            {fieldTrips.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No field trips found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fieldTrips.map((trip) => (
                      <tr key={trip.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trip.staff?.user?.name || trip.staff?.user?.email || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(trip.startTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trip.endTime ? formatDate(trip.endTime) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(trip.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trip.computedKm != null ? `${trip.computedKm.toFixed(2)} km` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
