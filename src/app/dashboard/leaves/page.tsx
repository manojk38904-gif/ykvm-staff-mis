"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaveApproval {
  id: string;
  decision: string;
  comment: string | null;
  decidedAt: string | null;
  approver: { name: string | null };
}

interface Leave {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
  approvals: LeaveApproval[];
  staff?: {
    user: { name: string | null; email: string | null };
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function LeavesPage() {
  const { data: session, status } = useSession();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "PAID",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const user = session?.user as any;
  const isStaff = user?.role === "STAFF";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUB_ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      fetchLeaves();
    }
  }, [status]);

  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/leaves");
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch {
      setError("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to apply for leave");
      } else {
        setSuccess("Leave application submitted successfully!");
        setFormData({ type: "PAID", fromDate: "", toDate: "", reason: "" });
        setShowForm(false);
        fetchLeaves();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (leaveId: string, decision: string) => {
    const comment = prompt(`Add a comment for ${decision.toLowerCase()} (optional):`);
    setActionLoading(leaveId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, decision, comment: comment || "" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to ${decision.toLowerCase()} leave`);
      } else {
        setSuccess(`Leave ${decision.toLowerCase()} successfully!`);
        fetchLeaves();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          {isStaff && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? "Cancel" : "+ Apply for Leave"}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for Leave</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="PAID">Paid Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">From Date</label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">To Date</label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Reason for leave (optional)"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">
              {isStaff ? "My Leave Applications" : "All Leave Applications"} ({leaves.length})
            </h3>
          </div>
          {leaves.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {isStaff
                ? 'No leave applications yet. Click "+ Apply for Leave" to submit one.'
                : "No leave applications found."}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {leaves.map((leave) => (
                <li key={leave.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isAdmin && leave.staff && (
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {leave.staff.user.name || leave.staff.user.email || "Unknown Staff"}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {leave.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[leave.status] || "bg-gray-100 text-gray-800"}`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(leave.fromDate)} — {formatDate(leave.toDate)}
                      </p>
                      {leave.reason && (
                        <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                      )}
                      {leave.approvals && leave.approvals.length > 0 && (
                        <div className="mt-2">
                          {leave.approvals.map((a) => (
                            <p key={a.id} className="text-xs text-gray-400">
                              {a.decision} by {a.approver?.name || "Admin"}
                              {a.comment ? ` — "${a.comment}"` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    {isAdmin && leave.status === "PENDING" && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleDecision(leave.id, "APPROVED")}
                          disabled={actionLoading === leave.id}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(leave.id, "REJECTED")}
                          disabled={actionLoading === leave.id}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
