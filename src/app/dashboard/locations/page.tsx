"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface OfficeLocation {
  id: string;
  name: string;
  lat: string;
  lng: string;
  radiusMeters: number;
  active: boolean;
  createdAt: string;
}

export default function LocationsPage() {
  const { data: session, status } = useSession();
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", lat: "", lng: "", radiusMeters: "10" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      if (!["ADMIN", "SUB_ADMIN"].includes(userRole)) {
        window.location.href = "/dashboard";
      } else {
        fetchLocations();
      }
    }
  }, [status, session]);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/locations");
      const data = await res.json();
      setLocations(data.locations || []);
    } catch {
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude.toFixed(7),
          lng: position.coords.longitude.toFixed(7),
        });
        setGettingLocation(false);
      },
      () => {
        setError("Unable to get your location. Please allow location access.");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: formData.name,
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      radiusMeters: parseInt(formData.radiusMeters) || 10,
    };

    try {
      const res = await fetch("/api/admin/locations", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save location");
      } else {
        setSuccess(editingId ? "Location updated successfully!" : "Location created successfully!");
        resetForm();
        fetchLocations();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", lat: "", lng: "", radiusMeters: "10" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (loc: OfficeLocation) => {
    setFormData({
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      radiusMeters: loc.radiusMeters.toString(),
    });
    setEditingId(loc.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleToggleActive = async (loc: OfficeLocation) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loc.id, active: !loc.active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update location");
      } else {
        setSuccess(`Location ${!loc.active ? "activated" : "deactivated"} successfully`);
        fetchLocations();
      }
    } catch {
      setError("Something went wrong");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete location "${name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete location");
      } else {
        setSuccess("Location deleted successfully");
        fetchLocations();
      }
    } catch {
      setError("Something went wrong");
    }
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Office Locations</h2>
          <button
            onClick={() => {
              if (showForm && editingId) {
                resetForm();
              } else {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({ name: "", lat: "", lng: "", radiusMeters: "10" });
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Location"}
          </button>
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

        {showForm && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Location" : "Add New Location"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. Main Office"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 28.6139391"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 77.2090212"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.radiusMeters}
                  onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gettingLocation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors border border-gray-300"
                >
                  {gettingLocation ? "Getting Location..." : "📍 Use My Current Location"}
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving..." : editingId ? "Update Location" : "Create Location"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">
              Locations ({locations.length})
            </h3>
          </div>
          {locations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No office locations added yet. Click "+ Add Location" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitude</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitude</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radius (m)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((loc) => (
                    <tr key={loc.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.lat}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.lng}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.radiusMeters}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            loc.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {loc.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleToggleActive(loc)}
                          className={`text-sm ${
                            loc.active
                              ? "text-yellow-600 hover:text-yellow-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {loc.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleEdit(loc)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {userRole === "ADMIN" && (
                          <button
                            onClick={() => handleDelete(loc.id, loc.name)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
