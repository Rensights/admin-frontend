"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, DashboardStats } from "@/lib/api";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/badge/Badge";
import { ArrowUpIcon, GroupIcon, BoxIconLine } from "@/icons";

// Dynamically import charts to avoid SSR issues
const ChartComponent = dynamic(() => import("@/components/DashboardCharts"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading charts...</div>
});

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await adminApiClient.getDashboardStats();
      setStats(statsData);
    } catch (error: any) {
      console.error("Error loading dashboard stats:", error);
      setError(error.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadStats();
  }, [pathname, router, loadStats]);

  if (loading && !stats) {
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
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Stats Cards - TailAdmin style */}
      {stats && (
        <>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Customers
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {stats.totalUsers.toLocaleString()}
                  </h4>
                </div>
                <Badge color="success">
                  <ArrowUpIcon />
                  11.01%
                </Badge>
              </div>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <BoxIconLine className="text-gray-800 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Active Subscriptions
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {stats.activeSubscriptions.toLocaleString()}
                  </h4>
                </div>
                <Badge color="success">
                  <ArrowUpIcon />
                  9.05%
                </Badge>
              </div>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total Revenue
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    ${stats.totalRevenue.toLocaleString()}
                  </h4>
                </div>
                <Badge color="success">
                  <ArrowUpIcon />
                  +10%
                </Badge>
              </div>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Premium Users
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {stats.premiumUsers.toLocaleString()}
                  </h4>
                </div>
                <Badge color="success">
                  <ArrowUpIcon />
                  +5%
                </Badge>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="col-span-12 xl:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    User Distribution
                  </h3>
                  <p className="mt-1 font-normal text-gray-500 text-theme-sm dark:text-gray-400">
                    Breakdown by subscription tier
                  </p>
                </div>
              </div>
              <div className="pb-6">
                {stats && <ChartComponent stats={stats} />}
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                Subscription Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free Users</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {stats.freeUsers.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Premium Users</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {stats.premiumUsers.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Enterprise Users</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {stats.enterpriseUsers.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

