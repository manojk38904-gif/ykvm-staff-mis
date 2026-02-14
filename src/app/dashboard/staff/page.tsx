"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  staff: {
    id: string;
    designation: string | null;
    department: string | null;
    salary: string | null;
    joiningDate: string | null;
    status: string | null;
  } | null;
}

interface EditFormData {
  userId: string;
  name: string;
  phone: string;
  designation: string;
  department: string;
  salary: string;
  status: string;
}

export default function StaffPage() {
  const { data: session, status } = useSession();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    designation: "",
    department: "",
    salary: "",
    joiningDate: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      if (userRole !== "ADMIN" && userRole !== "SUB_ADMIN") {
        window.location.href = "/dashboard";
      } else {
        fetchStaff();
      }
    }
  }, [status, session]);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      setStaffList(data.staff || []);
    } catch {
      setError("Failed to load staff");
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
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to enroll staff");
      } else {
        setSuccess("Staff enrolled successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          designation: "",
          department: "",
          salary: "",
          joiningDate: "",
        });
        setShowForm(false);
        fetchStaff();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setEditData({
      userId: staff.id,
      name: staff.name || "",
      phone: staff.phone || "",
      designation: staff.staff?.designation || "",
      department: staff.staff?.department || "",
      salary: staff.staff?.salary || "",
      status: staff.staff?.status || "Active",
    });
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    setEditSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update staff");
      } else {
        setSuccess("Staff updated successfully!");
        setEditData(null);
        fetchStaff();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string | null) => {
    if (!confirm(`Are you sure you want to delete staff member "${name || "Unknown"}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete staff");
      } else {
        setSuccess("Staff member deleted successfully");
        fetchStaff();
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

      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <button
            onClick={() => { setShowForm(!showForm); setEditData(null); }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ Enroll New Staff"}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enroll New Staff</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="staff@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Login password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. Field Officer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. Operations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Salary</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. 25000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Enrolling..." : "Enroll Staff"}
                </button>
              </div>
            </form>
          </div>
        )}

        {editData && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Staff</h3>
              <button
                onClick={() => setEditData(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input
                  type="text"
                  value={editData.designation}
                  onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Salary</label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.salary}
                  onChange={(e) => setEditData({ ...editData, salary: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {editSubmitting ? "Updating..." : "Update Staff"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">
              Staff Members ({staffList.length})
            </h3>
          </div>
          {staffList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No staff members enrolled yet. Click "+ Enroll New Staff" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffList.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {s.name || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.email || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.phone || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.staff?.designation || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.staff?.department || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {s.staff?.status === "Active" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : s.staff?.status === "Inactive" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {s.staff?.status || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {userRole === "ADMIN" && (
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="text-red-600 hover:text-red-800"
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
