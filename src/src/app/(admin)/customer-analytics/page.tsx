"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminApiClient,
  CustomerAnalyticsSummary,
  DailyActiveUsersPoint,
  MonthlyActiveUsersPoint,
  CustomerGrowthPoint,
  CustomerLoginStat,
  PageViewStat,
  EventTypeStat,
} from "@/lib/api";
import DailyActiveUsersChart from "@/components/ecommerce/DailyActiveUsersChart";
import MonthlyActiveUsersChart from "@/components/ecommerce/MonthlyActiveUsersChart";
import CustomerGrowthChart from "@/components/ecommerce/CustomerGrowthChart";
import { downloadCsv } from "@/lib/csv";
import { BoltIcon, CalenderIcon, GroupIcon, ListIcon } from "@/icons";

const ANALYTICS_WINDOW_DAYS = 30;
const TREND_MONTHS = 12;

const ACTIVE_NOW_REFRESH_MS = 30_000;

export default function CustomerAnalyticsPage() {
  const [summary, setSummary] = useState<CustomerAnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<DailyActiveUsersPoint[]>([]);
  const [mauTrend, setMauTrend] = useState<MonthlyActiveUsersPoint[]>([]);
  const [growthTrend, setGrowthTrend] = useState<CustomerGrowthPoint[]>([]);
  const [customers, setCustomers] = useState<CustomerLoginStat[]>([]);
  const [exporting, setExporting] = useState(false);
  const [pageViews, setPageViews] = useState<PageViewStat[]>([]);
  const [eventBreakdown, setEventBreakdown] = useState<EventTypeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, trendData, mauData, growthData, customersData, pageViewData, eventData] =
        await Promise.all([
          adminApiClient.getCustomerAnalyticsSummary(),
          adminApiClient.getCustomerAnalyticsTrend(ANALYTICS_WINDOW_DAYS),
          adminApiClient.getMonthlyActiveTrend(TREND_MONTHS),
          adminApiClient.getCustomerGrowthTrend(TREND_MONTHS),
          adminApiClient.getCustomerLoginStats(currentPage, 20),
          adminApiClient.getPageViewStats(ANALYTICS_WINDOW_DAYS),
          adminApiClient.getEventTypeBreakdown(ANALYTICS_WINDOW_DAYS),
        ]);
      setSummary(summaryData);
      setTrend(trendData);
      setMauTrend(mauData);
      setGrowthTrend(growthData);
      setCustomers(customersData.content);
      setTotalPages(customersData.totalPages || 1);
      setPageViews(pageViewData);
      setEventBreakdown(eventData);
    } catch (err: any) {
      setError(err.message || "Failed to load customer analytics");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const handleExportCustomers = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      await adminApiClient.downloadCustomerLoginStatsCsv();
    } catch (err: any) {
      setError(err.message || "Failed to export customers");
    } finally {
      setExporting(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // "Active Right Now" is time-sensitive (strict 5-min window), so refresh it
  // independently on a short interval without reloading the whole page.
  useEffect(() => {
    const interval = setInterval(() => {
      adminApiClient.getCustomerAnalyticsSummary().then(setSummary).catch(() => {});
    }, ACTIVE_NOW_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading customer analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Customer Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Active users and per-customer login activity
        </p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-50 dark:bg-success-500/15">
            <BoltIcon className="text-success-600 size-6 dark:text-success-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Active Right Now</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {(summary?.activeNow ?? 0).toLocaleString()}
            </h4>
            <span className="text-xs text-gray-400 dark:text-gray-500">Heartbeat in last 5 min</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-500/20">
            <BoltIcon className="text-brand-600 size-6 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Daily Active Users</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {(summary?.dailyActiveUsers ?? 0).toLocaleString()}
            </h4>
            <span className="text-xs text-gray-400 dark:text-gray-500">Logged in, last 24h</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
            <CalenderIcon className="text-emerald-600 size-6 dark:text-emerald-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Active Users</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {(summary?.monthlyActiveUsers ?? 0).toLocaleString()}
            </h4>
            <span className="text-xs text-gray-400 dark:text-gray-500">Logged in, last 30 days</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800">
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Customers</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {(summary?.totalUsers ?? 0).toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <DailyActiveUsersChart data={trend} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 lg:grid-cols-2">
        <MonthlyActiveUsersChart data={mauTrend} />
        <CustomerGrowthChart data={growthTrend} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListIcon className="size-5 text-gray-500 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Most Viewed Pages</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Last {ANALYTICS_WINDOW_DAYS} days</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "most-viewed-pages",
                  [
                    { key: "pagePath", label: "Page" },
                    { key: "viewCount", label: "Views" },
                  ],
                  pageViews
                )
              }
              disabled={pageViews.length === 0}
              className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ⬇ CSV
            </button>
          </div>
          <div className="p-6">
            {pageViews.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No page views recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {pageViews.map((pv) => (
                  <li key={pv.pagePath} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate mr-4">{pv.pagePath}</span>
                    <span className="font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {pv.viewCount.toLocaleString()} views
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Activity Breakdown</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">Last {ANALYTICS_WINDOW_DAYS} days</p>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "activity-breakdown",
                  [
                    { key: "eventType", label: "Event Type" },
                    { key: "eventCount", label: "Count" },
                  ],
                  eventBreakdown
                )
              }
              disabled={eventBreakdown.length === 0}
              className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ⬇ CSV
            </button>
          </div>
          <div className="p-6">
            {eventBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {eventBreakdown.map((ev) => (
                  <li key={ev.eventType} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{ev.eventType}</span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {ev.eventCount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Customer Login Activity</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Table is paged; CSV exports all customers
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCustomers}
            disabled={exporting}
            className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {exporting ? "Exporting…" : "⬇ CSV (all customers)"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Total Logins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white/90">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {customer.firstName || customer.lastName
                        ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {customer.loginCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {customer.lastLoginAt
                        ? new Date(customer.lastLoginAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/users/list/${customer.userId}`}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage + 1} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 dark:border-gray-700"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
