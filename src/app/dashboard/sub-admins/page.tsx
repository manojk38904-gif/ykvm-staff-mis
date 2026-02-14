"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SubAdmin {
  id: string;
  name: string | null;
  email: string | null;
  googleId: string | null;
  image: string | null;
  createdAt: string;
}

export default function SubAdminsPage() {
  const { data: session, status } = useSession();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      const user = session?.user as any;
      if (user?.role !== "ADMIN") {
        window.location.href = "/dashboard";
      } else {
        fetchSubAdmins();
      }
    }
  }, [status, session]);

  const fetchSubAdmins = async () => {
    try {
      const res = await fetch("/api/admin/sub-admins");
      const data = await res.json();
      setSubAdmins(data.subAdmins || []);
    } catch {
      setError("Failed to load Sub-Admins");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/sub-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create Sub-Admin");
      } else {
        setSuccess("Sub-Admin created successfully!");
        setFormData({ name: "", email: "", password: "" });
        setShowForm(false);
        fetchSubAdmins();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string | null) => {
    if (!confirm(`Are you sure you want to remove Sub-Admin "${name || "Unknown"}"?`)) return;

    try {
      const res = await fetch(`/api/admin/sub-admins?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to remove Sub-Admin");
      } else {
        setSuccess("Sub-Admin removed successfully");
        fetchSubAdmins();
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
          <h2 className="text-2xl font-bold text-gray-900">Sub-Admin Management</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Sub-Admin"}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Sub-Admin</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add email for Google Sign-In access. Password is optional (only needed if the Sub-Admin will also use credential login).
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Sub-Admin name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email (Google Account)</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="example@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Leave empty for Google-only login"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Creating..." : "Create Sub-Admin"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">
              Sub-Admins ({subAdmins.length})
            </h3>
          </div>
          {subAdmins.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No Sub-Admins created yet. Click "+ New Sub-Admin" to add one.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {subAdmins.map((sa) => (
                <li key={sa.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {sa.image ? (
                      <img src={sa.image} alt="" className="h-10 w-10 rounded-full" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {(sa.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sa.name || "No Name"}</p>
                      <p className="text-sm text-gray-500">{sa.email}</p>
                    </div>
                    {sa.googleId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Google Linked
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(sa.id, sa.name)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
