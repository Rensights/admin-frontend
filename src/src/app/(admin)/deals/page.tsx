"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, Deal } from "@/lib/api";
import Button from "@/components/ui/button/Button";

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getTodayPendingDeals(currentPage, 20);
      setDeals(response.content);
      setTotalPages(response.totalPages);
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

  const handleSeedTestDeals = async () => {
    if (!confirm("Are you sure you want to add test deals to the database? This will add 13 test deals.")) {
      return;
    }
    
    setSeeding(true);
    setActionMessage(null);
    try {
      await adminApiClient.seedTestDeals();
      setActionMessage("Test deals added successfully!");
      setTimeout(() => {
        setActionMessage(null);
        loadDeals();
      }, 2000);
    } catch (error: any) {
      console.error("Error seeding test deals:", error);
      setActionMessage(error.message || "Failed to add test deals");
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteAllDeals = async () => {
    if (!confirm("WARNING: This will delete ALL deals from the database! This action cannot be undone. Are you absolutely sure?")) {
      return;
    }
    
    if (!confirm("Please confirm one more time: Delete ALL deals?")) {
      return;
    }
    
    setDeleting(true);
    setActionMessage(null);
    try {
      await adminApiClient.deleteAllDeals();
      setActionMessage("All deals deleted successfully!");
      setTimeout(() => {
        setActionMessage(null);
        loadDeals();
      }, 2000);
    } catch (error: any) {
      console.error("Error deleting all deals:", error);
      setActionMessage(error.message || "Failed to delete deals");
    } finally {
      setDeleting(false);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Today's Deals</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pending deals awaiting approval</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSeedTestDeals}
            disabled={seeding}
            className="whitespace-nowrap"
          >
            {seeding ? "Adding..." : "Add Test Deals"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteAllDeals}
            disabled={deleting}
            className="whitespace-nowrap border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
          >
            {deleting ? "Deleting..." : "Delete All Deals"}
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${
          actionMessage.includes("success") 
            ? "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400"
            : "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400"
        }`}>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white/90">{deal.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{deal.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{deal.listedPrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-brand-600 hover:text-brand-900 dark:text-brand-400">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
