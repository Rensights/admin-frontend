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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  // Calculate percentage changes (mock data for now)
  const getPercentageChange = (current: number, previous: number = current * 0.9) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(2);
  };

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
        {/* Top Header - TailAdmin style */}
        <header className="top-header-bar">
          <div className="header-left">
            <button className="search-trigger" title="Search (⌘K)">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="search-text">⌘ K</span>
            </button>
          </div>

          <div className="header-right">
            {/* Notifications */}
            <div className="header-icon-wrapper" style={{ position: 'relative' }}>
              <button 
                className="header-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2C8.34315 2 7 3.34315 7 5V8.58579C7 9.11622 6.78929 9.62493 6.41421 10L4 12.4142V14H16V12.4142L13.5858 10C13.2107 9.62493 13 9.11622 13 8.58579V5C13 3.34315 11.6569 2 10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 16H12M10 16V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="notification-badge">3</span>
              </button>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h5>Notification</h5>
                  </div>
                  <div className="dropdown-body">
                    <div className="notification-item">
                      <div className="notification-content">
                        <p className="notification-title">User Terry Franci requests permission</p>
                        <p className="notification-meta">5 min ago</p>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notification-content">
                        <p className="notification-title">User Alena Franci requests permission</p>
                        <p className="notification-meta">8 min ago</p>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notification-content">
                        <p className="notification-title">User Jocelyn Kenter requests permission</p>
                        <p className="notification-meta">15 min ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-footer">
                    <a href="#" className="view-all-link">View All Notification</a>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="header-icon-wrapper" style={{ position: 'relative' }}>
              <button 
                className="user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">M</div>
                <span className="user-name">Musharof</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar">M</div>
                    <div>
                      <p className="user-dropdown-name">Musharof Chowdhury</p>
                      <p className="user-dropdown-email">musharof@example.com</p>
                    </div>
                  </div>
                  <div className="user-dropdown-body">
                    <a href="#" className="dropdown-item">Edit profile</a>
                    <a href="#" className="dropdown-item">Account settings</a>
                    <a href="#" className="dropdown-item">Support</a>
                  </div>
                  <div className="user-dropdown-footer">
                    <button 
                      className="dropdown-item logout-item"
                      onClick={() => adminApiClient.logout()}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content-wrapper">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {stats && (
            <div className="dashboard-overview">
              {/* Stats Cards - TailAdmin style */}
              <div className="stats-grid-tailadmin">
                <div className="stat-card-tailadmin">
                  <div className="stat-card-header">
                    <h6 className="stat-card-title">Customers</h6>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-card-value">{stats.totalUsers.toLocaleString()}</h3>
                    <div className="stat-card-footer">
                      <span className="stat-percentage positive">11.01%</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card-tailadmin">
                  <div className="stat-card-header">
                    <h6 className="stat-card-title">Active Subscriptions</h6>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-card-value">{stats.activeSubscriptions.toLocaleString()}</h3>
                    <div className="stat-card-footer">
                      <span className="stat-percentage positive">9.05%</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card-tailadmin">
                  <div className="stat-card-header">
                    <h6 className="stat-card-title">Total Revenue</h6>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-card-value">${stats.totalRevenue.toLocaleString()}</h3>
                    <div className="stat-card-footer">
                      <span className="stat-percentage positive">+10%</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card-tailadmin">
                  <div className="stat-card-header">
                    <h6 className="stat-card-title">Premium Users</h6>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-card-value">{stats.premiumUsers.toLocaleString()}</h3>
                    <div className="stat-card-footer">
                      <span className="stat-percentage positive">+5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section - TailAdmin style */}
              <div className="charts-grid-tailadmin">
                <div className="chart-card-tailadmin">
                  <div className="chart-card-header">
                    <h5 className="chart-card-title">User Distribution</h5>
                    <div className="chart-card-actions">
                      <button className="card-action-btn">View More</button>
                      <button className="card-action-btn">Delete</button>
                    </div>
                  </div>
                  <div className="chart-card-body">
                    <ChartComponent stats={stats} />
                  </div>
                </div>

                <div className="chart-card-tailadmin">
                  <div className="chart-card-header">
                    <h5 className="chart-card-title">Subscription Statistics</h5>
                    <div className="chart-card-actions">
                      <button className="card-action-btn">View More</button>
                      <button className="card-action-btn">Delete</button>
                    </div>
                  </div>
                  <div className="chart-card-body">
                    <div className="stats-summary">
                      <div className="stat-summary-item">
                        <span className="stat-summary-label">Free Users</span>
                        <span className="stat-summary-value">{stats.freeUsers.toLocaleString()}</span>
                      </div>
                      <div className="stat-summary-item">
                        <span className="stat-summary-label">Premium Users</span>
                        <span className="stat-summary-value">{stats.premiumUsers.toLocaleString()}</span>
                      </div>
                      <div className="stat-summary-item">
                        <span className="stat-summary-label">Enterprise Users</span>
                        <span className="stat-summary-value">{stats.enterpriseUsers.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
