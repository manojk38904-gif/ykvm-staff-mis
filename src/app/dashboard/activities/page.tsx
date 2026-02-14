"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface ActivityPhoto {
  id: string;
  file: string;
  lat: number | null;
  lng: number | null;
}

interface Activity {
  id: string;
  fieldTripId: string;
  title: string;
  description: string | null;
  villageName: string | null;
  time: string;
  gpsRequired: boolean;
  photos: ActivityPhoto[];
  attendanceSheet: { id: string; file: string } | null;
  proceeding: { id: string } | null;
}

interface FieldTrip {
  id: string;
  startTime: string;
  endTime: string | null;
  status: string;
  staff?: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
}

export default function ActivitiesPage() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    villageName: "",
    time: new Date().toISOString().slice(0, 16),
    fieldTripId: "",
  });
  const [photoFiles, setPhotoFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;
  const role = user?.role;
  const isStaff = role === "STAFF";
  const isAdmin = role === "ADMIN" || role === "SUB_ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      fetchActivities();
      if (isStaff) {
        fetchFieldTrips();
      }
    }
  }, [status, session]);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activity");
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {
      setError("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldTrips = async () => {
    try {
      const res = await fetch("/api/field-trips");
      const data = await res.json();
      setFieldTrips(data.fieldTrips || []);
    } catch {
      // silently fail
    }
  };

  const ongoingTrips = fieldTrips.filter((ft) => ft.status === "ONGOING");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoFiles((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fieldTripId) {
      setError("Please select a field trip");
      return;
    }
    if (photoFiles.length === 0) {
      setError("Please add at least one photo");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldTripId: formData.fieldTripId,
          title: formData.title,
          description: formData.description,
          villageName: formData.villageName,
          time: formData.time ? new Date(formData.time).toISOString() : undefined,
          photos: photoFiles.map((data) => ({ data })),
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to create activity");
      } else {
        setSuccess("Activity recorded successfully!");
        setFormData({
          title: "",
          description: "",
          villageName: "",
          time: new Date().toISOString().slice(0, 16),
          fieldTripId: "",
        });
        setPhotoFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowForm(false);
        fetchActivities();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = activities.reduce<Record<string, Activity[]>>((acc, act) => {
    const key = act.fieldTripId || "unlinked";
    if (!acc[key]) acc[key] = [];
    acc[key].push(act);
    return acc;
  }, {});

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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Activities</h2>
          {isStaff && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? "Cancel" : "+ Record Activity"}
            </button>
          )}
        </div>

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

        {isStaff && showForm && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record New Activity</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Field Trip</label>
                <select
                  required
                  value={formData.fieldTripId}
                  onChange={(e) => setFormData({ ...formData, fieldTripId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select an ongoing field trip</option>
                  {ongoingTrips.map((ft) => (
                    <option key={ft.id} value={ft.id}>
                      Trip started {new Date(ft.startTime).toLocaleString()}
                    </option>
                  ))}
                </select>
                {ongoingTrips.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No ongoing field trips found. Start a field trip first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Activity title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Describe the activity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Village Name</label>
                <input
                  type="text"
                  value={formData.villageName}
                  onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Village name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="datetime-local"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photoFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photoFiles.map((photo, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  At least 1 photo required. Accepts PNG and JPEG.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Activity"}
              </button>
            </form>
          </div>
        )}

        {activities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
            No activities recorded yet.
          </div>
        ) : (
          Object.entries(grouped).map(([tripId, tripActivities]) => (
            <div key={tripId} className="mb-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700">
                    Field Trip: {tripId === "unlinked" ? "Unlinked" : tripId.slice(0, 8) + "..."}
                    <span className="ml-2 text-gray-400">
                      ({tripActivities.length} {tripActivities.length === 1 ? "activity" : "activities"})
                    </span>
                  </h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {tripActivities.map((activity) => (
                    <li key={activity.id} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            {activity.villageName && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                {activity.villageName}
                              </span>
                            )}
                            <span>{new Date(activity.time).toLocaleString()}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {activity.photos.length} {activity.photos.length === 1 ? "photo" : "photos"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
