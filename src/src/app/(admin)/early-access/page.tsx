"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, EarlyAccessRequest } from "@/lib/api";

export default function EarlyAccessRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EarlyAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.getEarlyAccessRequests(0, 200);
      setRequests(data.content || []);
    } catch (err: any) {
      setError(err.message || "Failed to load early access requests");
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadRequests();
  }, [router, loadRequests]);

  const downloadCsv = () => {
    const headers = [
      "Full Name",
      "Email",
      "Phone",
      "Location",
      "Experience",
      "Budget",
      "Portfolio",
      "Timeline",
      "Goals",
      "Property Types",
      "Target Regions",
      "Challenges",
      "Valuable Services",
      "Created At",
    ];

    const rows = requests.map((req) => [
      req.fullName || "",
      req.email || "",
      req.phone || "",
      req.location || "",
      req.experience || "",
      req.budget || "",
      req.portfolio || "",
      req.timeline || "",
      (req.goals || []).join("; "),
      (req.propertyTypes || []).join("; "),
      req.targetRegions || "",
      req.challenges || "",
      req.valuableServices || "",
      req.createdAt || "",
    ]);

    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escape(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "early-access-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading early access requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Early Access Requests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and export early access submissions
          </p>
        </div>
        <button
          onClick={downloadCsv}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          Download CSV
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Timeline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No early access requests found
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{req.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{req.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{req.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{req.budget || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{req.timeline || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {req.createdAt ? new Date(req.createdAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
