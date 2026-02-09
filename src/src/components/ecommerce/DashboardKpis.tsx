"use client";

import { CheckCircleIcon, GroupIcon, PieChartIcon, TaskIcon, BoltIcon } from "@/icons";

interface DashboardKpisProps {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  activeSubscriptions: number;
  pendingAnalysisRequests: number;
}

export default function DashboardKpis({
  totalUsers,
  activeUsers,
  verifiedUsers,
  activeSubscriptions,
  pendingAnalysisRequests,
}: DashboardKpisProps) {
  const items = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
      bg: "bg-gray-100 dark:bg-gray-800",
    },
    {
      label: "Active Users",
      value: activeUsers,
      icon: <BoltIcon className="text-brand-600 size-6 dark:text-brand-400" />,
      bg: "bg-brand-100 dark:bg-brand-500/20",
    },
    {
      label: "Verified Users",
      value: verifiedUsers,
      icon: <CheckCircleIcon className="text-emerald-600 size-6 dark:text-emerald-400" />,
      bg: "bg-emerald-100 dark:bg-emerald-500/20",
    },
    {
      label: "Active Subscriptions",
      value: activeSubscriptions,
      icon: <PieChartIcon className="text-indigo-600 size-6 dark:text-indigo-400" />,
      bg: "bg-indigo-100 dark:bg-indigo-500/20",
    },
    {
      label: "Pending Analysis",
      value: pendingAnalysisRequests,
      icon: <TaskIcon className="text-amber-600 size-6 dark:text-amber-400" />,
      bg: "bg-amber-100 dark:bg-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 md:gap-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${item.bg}`}>
            {item.icon}
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {item.value.toLocaleString()}
            </h4>
          </div>
        </div>
      ))}
    </div>
  );
}
