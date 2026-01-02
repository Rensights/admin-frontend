"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, DashboardStats } from "@/lib/api";
import IncomeChart from "@/components/ecommerce/IncomeChart";
import TotalIncomeCard from "@/components/ecommerce/TotalIncomeCard";
import DeviceTypeChart from "@/components/ecommerce/DeviceTypeChart";
import UserRegistrationsChart from "@/components/ecommerce/UserRegistrationsChart";
import UserTypeTotalsCard from "@/components/ecommerce/UserTypeTotalsCard";
import DemographicCard from "@/components/ecommerce/DemographicCard";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const statsData = await adminApiClient.getDashboardStats();
      setStats(statsData);
    } catch (error: any) {
      console.error("Error loading dashboard stats:", error);
      // If unauthorized, redirect to login
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSyncAllInvoices = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await adminApiClient.syncAllUsersInvoices();
      setSyncMessage(`Successfully synced invoices for ${result.syncedCount} users`);
      // Reload stats after sync
      await loadStats();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (error: any) {
      setSyncMessage(`Error: ${error.message || "Failed to sync invoices"}`);
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncing(false);
    }
  }, [loadStats]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadStats();
  }, [router, loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sync All Users Invoices Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Invoice Sync
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync invoices for all users from Stripe
            </p>
          </div>
          <div className="flex items-center gap-4">
            {syncMessage && (
              <span className={`text-sm ${syncMessage.includes('Error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {syncMessage}
              </span>
            )}
            <button
              onClick={handleSyncAllInvoices}
              disabled={syncing}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Sync All Users
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Income Chart and Total Income Card */}
        <div className="col-span-12 space-y-6 xl:col-span-7">
        <IncomeChart
          monthlyIncome={stats?.monthlyIncome}
          dailyIncome={stats?.dailyIncome}
          totalRevenue={stats?.totalRevenue || 0}
        />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <TotalIncomeCard totalRevenue={stats?.totalRevenue || 0} />
      </div>

      {/* Device Type Chart */}
      <div className="col-span-12">
        <DeviceTypeChart deviceTypeStats={stats?.deviceTypeStats} />
      </div>

      {/* User Registrations Chart */}
      <div className="col-span-12">
        <UserRegistrationsChart
          monthlyUserRegistrations={stats?.monthlyUserRegistrations}
          dailyUserRegistrations={stats?.dailyUserRegistrations}
        />
      </div>

      {/* User Type Totals and Demographic */}
      <div className="col-span-12 xl:col-span-5">
        <UserTypeTotalsCard
          freeUsers={stats?.freeUsers || 0}
          premiumUsers={stats?.premiumUsers || 0}
          enterpriseUsers={stats?.enterpriseUsers || 0}
        />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <DemographicCard />
      </div>
      </div>
    </div>
  );
}
