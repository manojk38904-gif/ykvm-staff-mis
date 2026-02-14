"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

type ReportType = "attendance" | "leaves" | "field-trips" | "payroll";

interface StaffOption {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [staffId, setStaffId] = useState<string>("");
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      const user = session?.user as any;
      if (user?.role !== "ADMIN" && user?.role !== "SUB_ADMIN") {
        window.location.href = "/dashboard";
      } else {
        fetchStaffList();
      }
    }
  }, [status, session]);

  const fetchStaffList = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      const list = (data.staff || []).map((s: any) => ({
        id: s.staff?.id || s.id,
        name: s.name || s.email || "Unknown",
      }));
      setStaffList(list);
    } catch {
      // ignore
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError("");
    setFetched(false);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (month) params.set("month", month);
      if (year) params.set("year", year);
      if (staffId) params.set("staffId", staffId);
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch report");
        setRecords([]);
      } else {
        setRecords(data.records || []);
      }
      setFetched(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getSummaryStats = () => {
    if (records.length === 0) return null;
    const total = records.length;
    const statusCounts: Record<string, number> = {};
    records.forEach((r) => {
      const s = r.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    return { total, statusCounts };
  };

  const downloadCSV = () => {
    if (records.length === 0) return;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === "attendance") {
      headers = ["Staff Name", "Date", "Status", "Distance (m)"];
      rows = records.map((r) => [
        r.staff?.user?.name || r.staff?.user?.email || "Unknown",
        new Date(r.datetime).toLocaleDateString(),
        r.status,
        r.distanceToOffice != null ? Math.round(r.distanceToOffice).toString() : "N/A",
      ]);
    } else if (reportType === "leaves") {
      headers = ["Staff Name", "Type", "From", "To", "Status"];
      rows = records.map((r) => [
        r.staff?.user?.name || r.staff?.user?.email || "Unknown",
        r.type,
        new Date(r.fromDate).toLocaleDateString(),
        new Date(r.toDate).toLocaleDateString(),
        r.status,
      ]);
    } else if (reportType === "field-trips") {
      headers = ["Staff Name", "Start", "End", "Distance (km)", "Status"];
      rows = records.map((r) => [
        r.staff?.user?.name || r.staff?.user?.email || "Unknown",
        new Date(r.startTime).toLocaleString(),
        r.endTime ? new Date(r.endTime).toLocaleString() : "Ongoing",
        r.computedKm != null ? r.computedKm.toFixed(2) : "N/A",
        r.status,
      ]);
    } else if (reportType === "payroll") {
      headers = ["Staff Name", "Month/Year", "Gross", "Deductions", "Net", "Status"];
      rows = records.map((r) => [
        r.staff?.user?.name || r.staff?.user?.email || "Unknown",
        `${r.month}/${r.year}`,
        r.gross,
        r.deductions,
        r.net,
        r.status,
      ]);
    }

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summary = getSummaryStats();

  const months = [
    { value: "", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const reportTabs: { key: ReportType; label: string }[] = [
    { key: "attendance", label: "Attendance Report" },
    { key: "leaves", label: "Leave Report" },
    { key: "field-trips", label: "Field Trip Report" },
    { key: "payroll", label: "Payroll Report" },
  ];

  if (status === "loading") {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Registers</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setReportType(tab.key); setRecords([]); setFetched(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                reportType === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g. 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff (Optional)</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {fetched && summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total Records</p>
            </div>
            {Object.entries(summary.statusCounts).map(([statusKey, count]) => (
              <div key={statusKey} className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-1">{statusKey}</p>
              </div>
            ))}
          </div>
        )}

        {fetched && records.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Download CSV
            </button>
          </div>
        )}

        {fetched && records.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
            No records found for the selected filters.
          </div>
        )}

        {fetched && records.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              {reportType === "attendance" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (m)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.staff?.user?.name || r.staff?.user?.email || "Unknown"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.datetime).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            r.status === "PRESENT" ? "bg-green-100 text-green-800" :
                            r.status === "LATE" ? "bg-yellow-100 text-yellow-800" :
                            r.status === "ABSENT" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.distanceToOffice != null ? Math.round(r.distanceToOffice) : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "leaves" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From - To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.staff?.user?.name || r.staff?.user?.email || "Unknown"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.fromDate).toLocaleDateString()} - {new Date(r.toDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            r.status === "APPROVED" ? "bg-green-100 text-green-800" :
                            r.status === "REJECTED" ? "bg-red-100 text-red-800" :
                            r.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "field-trips" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start - End</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.staff?.user?.name || r.staff?.user?.email || "Unknown"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.startTime).toLocaleString()} - {r.endTime ? new Date(r.endTime).toLocaleString() : "Ongoing"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.computedKm != null ? Number(r.computedKm).toFixed(2) : "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            r.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            r.status === "ONGOING" ? "bg-blue-100 text-blue-800" :
                            r.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "payroll" && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.staff?.user?.name || r.staff?.user?.email || "Unknown"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.month}/{r.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(r.gross).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(r.deductions).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{Number(r.net).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            r.status === "PAID" ? "bg-green-100 text-green-800" :
                            r.status === "GENERATED" ? "bg-blue-100 text-blue-800" :
                            r.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
