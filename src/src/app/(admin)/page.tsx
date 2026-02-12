"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, DashboardStats } from "@/lib/api";
import IncomeChart from "@/components/ecommerce/IncomeChart";
import TotalIncomeCard from "@/components/ecommerce/TotalIncomeCard";
import DeviceTypeChart from "@/components/ecommerce/DeviceTypeChart";
import UserRegistrationsChart from "@/components/ecommerce/UserRegistrationsChart";
import UserTypeTotalsCard from "@/components/ecommerce/UserTypeTotalsCard";
import SubscriptionStatusChart from "@/components/ecommerce/SubscriptionStatusChart";
import DashboardKpis from "@/components/ecommerce/DashboardKpis";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
      <DashboardKpis
        totalUsers={stats?.totalUsers || 0}
        activeUsers={stats?.activeUsers || 0}
        verifiedUsers={stats?.verifiedUsers || 0}
        activeSubscriptions={stats?.activeSubscriptions || 0}
        pendingAnalysisRequests={stats?.pendingAnalysisRequests || 0}
      />

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
        <SubscriptionStatusChart subscriptionStatusStats={stats?.subscriptionStatusStats} />
      </div>
      </div>
    </div>
  );
}
