"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, DashboardStats } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import "../dashboard.css";
import dynamic from "next/dynamic";

// Dynamically import charts to avoid SSR issues
const ChartComponent = dynamic(() => import("@/components/DashboardCharts"), {
  ssr: false,
  loading: () => <div className="chart-loading">Loading charts...</div>
});

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      <div className="dashboard-page">
        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="page-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Welcome back! Here's what's happening with your platform</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {stats && (
          <div className="dashboard-overview">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-label">Total Users</div>
                  <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-label">Active Subscriptions</div>
                  <div className="stat-value">{stats.activeSubscriptions.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card premium">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-label">Premium Users</div>
                  <div className="stat-value">{stats.premiumUsers.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card free">
                <div className="stat-icon">🆓</div>
                <div className="stat-content">
                  <div className="stat-label">Free Users</div>
                  <div className="stat-value">{stats.freeUsers.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card enterprise">
                <div className="stat-icon">🏢</div>
                <div className="stat-content">
                  <div className="stat-label">Enterprise Users</div>
                  <div className="stat-value">{stats.enterpriseUsers.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>User Distribution</h3>
                  <p>Breakdown by subscription tier</p>
                </div>
                <ChartComponent stats={stats} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
