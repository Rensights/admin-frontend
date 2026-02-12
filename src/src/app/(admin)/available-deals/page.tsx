"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApiClient, Deal } from "@/lib/api";

export default function AvailableDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [weeklyDealsEnabled, setWeeklyDealsEnabled] = useState(true);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [response, settings] = await Promise.all([
        adminApiClient.getApprovedDeals(currentPage, 20),
        adminApiClient.getWeeklyDealsEnabled(),
      ]);
      setDeals(response.content);
      setTotalPages(response.totalPages);
      setWeeklyDealsEnabled(settings.enabled);
    } catch (error: any) {
      console.error("Error loading deals:", error);
      setError(error.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDeals();
  }, [router, currentPage, loadDeals]);

  const handleToggleWeeklyDeals = async () => {
    try {
      const next = !weeklyDealsEnabled;
      await adminApiClient.setWeeklyDealsEnabled(next);
      setWeeklyDealsEnabled(next);
    } catch (error: any) {
      console.error("Error updating weekly deals setting:", error);
      setError(error.message || "Failed to update weekly deals setting");
    }
  };

  const handleArchive = async (dealId: string) => {
    if (!confirm("Are you sure you want to archive this deal? It will be moved to rejected/archived deals.")) {
      return;
    }

    setArchiving(dealId);
    setError(null);
    try {
      await adminApiClient.rejectDeal(dealId);
      setActionMessage("Deal archived successfully!");
      setTimeout(() => {
        setActionMessage(null);
        loadDeals();
      }, 1000);
    } catch (error: any) {
      console.error("Error archiving deal:", error);
      setError(error.message || "Failed to archive deal");
    } finally {
      setArchiving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Available Deals</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Approved deals visible to users</p>
        </div>
        <button
          onClick={handleToggleWeeklyDeals}
          className="px-4 py-2 rounded-lg text-white transition-colors"
          style={{ background: weeklyDealsEnabled ? "#16a34a" : "#ef4444" }}
        >
          {weeklyDealsEnabled ? "Weekly Deals Enabled" : "Weekly Deals Disabled"}
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 mb-4 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-500/10 dark:text-green-400">
          {actionMessage}
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No approved deals available
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white/90">{deal.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{deal.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{deal.listedPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        deal.active ? 'bg-success-50 text-success-600 dark:bg-success-500/15' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                      }`}>
                        {deal.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-3">
                        <Link href={`/deals/${deal.id}`} className="text-brand-600 hover:text-brand-900 dark:text-brand-400">
                          View
                        </Link>
                        <button
                          onClick={() => handleArchive(deal.id)}
                          disabled={archiving === deal.id}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 disabled:opacity-50"
                        >
                          {archiving === deal.id ? "Archiving..." : "Archive"}
                        </button>
                      </div>
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
