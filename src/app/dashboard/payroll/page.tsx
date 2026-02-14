"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface StaffInfo {
  id: string;
  userId: string;
  user: { name: string | null; email: string | null };
  designation: string | null;
  department: string | null;
}

interface PayrollRecord {
  id: string;
  staffId: string;
  month: number;
  year: number;
  gross: string;
  deductions: string;
  net: string;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  status: "PENDING" | "GENERATED" | "PAID";
  salaryPayments: { id: string; paidOn: string; method: string; referenceNo: string } | null;
  staff?: {
    id: string;
    user: { name: string | null; email: string | null };
  };
  createdAt: string;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollPage() {
  const { data: session, status } = useSession();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    staffId: "",
    month: "",
    year: new Date().getFullYear().toString(),
    gross: "",
    deductions: "0",
    presentDays: "",
    paidLeaveDays: "0",
    unpaidLeaveDays: "0",
  });
  const [payModal, setPayModal] = useState<{ payrollId: string; method: string; referenceNo: string } | null>(null);

  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "ADMIN";
  const isAdminOrSub = userRole === "ADMIN" || userRole === "SUB_ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      fetchPayrolls();
      if (isAdminOrSub) {
        fetchStaff();
      }
    }
  }, [status, session]);

  const fetchPayrolls = async () => {
    try {
      const res = await fetch("/api/payroll");
      const data = await res.json();
      setPayrolls(data.payrolls || []);
    } catch {
      setError("Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      const mapped = (data.staff || []).map((s: any) => ({
        id: s.staff?.id || s.id,
        userId: s.id,
        user: { name: s.name, email: s.email },
        designation: s.staff?.designation || null,
        department: s.staff?.department || null,
      }));
      setStaffList(mapped);
    } catch {
      console.error("Failed to load staff");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate payroll");
      } else {
        setSuccess("Payroll generated successfully!");
        setFormData({
          staffId: "",
          month: "",
          year: new Date().getFullYear().toString(),
          gross: "",
          deductions: "0",
          presentDays: "",
          paidLeaveDays: "0",
          unpaidLeaveDays: "0",
        });
        setShowForm(false);
        fetchPayrolls();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payModal) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payModal),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to mark as paid");
      } else {
        setSuccess("Payroll marked as paid!");
        setPayModal(null);
        fetchPayrolls();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "PENDING":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case "GENERATED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Generated</span>;
      case "PAID":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{s}</span>;
    }
  };

  const formatCurrency = (val: string) => {
    return `₹${parseFloat(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const grouped = payrolls.reduce<Record<string, PayrollRecord[]>>((acc, p) => {
    const key = `${p.year}-${String(p.month).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

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

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payroll</h2>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? "Cancel" : "+ Generate Payroll"}
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

        {showForm && isAdmin && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Payroll</h3>
            <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Staff Member</label>
                <select
                  required
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select Staff</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.name || s.user.email || s.id} {s.designation ? `(${s.designation})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Month</label>
                <select
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select Month</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{MONTH_NAMES[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  min="2020"
                  max="2030"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gross Salary (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.gross}
                  onChange={(e) => setFormData({ ...formData, gross: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deductions (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Present Days</label>
                <input
                  type="number"
                  required
                  value={formData.presentDays}
                  onChange={(e) => setFormData({ ...formData, presentDays: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Paid Leave Days</label>
                <input
                  type="number"
                  required
                  value={formData.paidLeaveDays}
                  onChange={(e) => setFormData({ ...formData, paidLeaveDays: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unpaid Leave Days</label>
                <input
                  type="number"
                  required
                  value={formData.unpaidLeaveDays}
                  onChange={(e) => setFormData({ ...formData, unpaidLeaveDays: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Generating..." : "Generate Payroll"}
                </button>
              </div>
            </form>
          </div>
        )}

        {payModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark as Paid</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={payModal.method}
                    onChange={(e) => setPayModal({ ...payModal, method: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference No.</label>
                  <input
                    type="text"
                    value={payModal.referenceNo}
                    onChange={(e) => setPayModal({ ...payModal, referenceNo: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Transaction ID / Reference"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleMarkPaid}
                    disabled={submitting || !payModal.method || !payModal.referenceNo}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Processing..." : "Confirm Payment"}
                  </button>
                  <button
                    onClick={() => setPayModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAdminOrSub && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">My Payroll Records</h3>
            </div>
            {payrolls.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No payroll records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrolls.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{MONTH_NAMES[p.month]} {p.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(p.gross)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(p.deductions)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(p.net)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{statusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {isAdminOrSub && (
          <>
            {sortedGroupKeys.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
                No payroll records found. {isAdmin ? 'Click "+ Generate Payroll" to create one.' : ""}
              </div>
            ) : (
              sortedGroupKeys.map((key) => {
                const records = grouped[key];
                const [y, m] = key.split("-").map(Number);
                return (
                  <div key={key} className="mb-6 bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-700">
                        {MONTH_NAMES[m]} {y} ({records.length} record{records.length !== 1 ? "s" : ""})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {records.map((p) => (
                            <tr key={p.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {p.staff?.user?.name || p.staff?.user?.email || "—"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(p.gross)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(p.deductions)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(p.net)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                P:{p.presentDays} PL:{p.paidLeaveDays} UL:{p.unpaidLeaveDays}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{statusBadge(p.status)}</td>
                              {isAdmin && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {p.status === "GENERATED" && (
                                    <button
                                      onClick={() => setPayModal({ payrollId: p.id, method: "", referenceNo: "" })}
                                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                                    >
                                      Mark as Paid
                                    </button>
                                  )}
                                  {p.status === "PAID" && p.salaryPayments && (
                                    <span className="text-xs text-gray-500">
                                      {p.salaryPayments.method} • {p.salaryPayments.referenceNo}
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </main>
    </div>
  );
}
