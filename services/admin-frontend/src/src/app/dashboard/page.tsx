"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, User, Subscription, DashboardStats } from "@/lib/api";
import "../dashboard.css";

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, currentPage]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, subscriptionsData] = await Promise.all([
        adminApiClient.getDashboardStats().catch((e) => {
          console.error("Stats error:", e);
          return null;
        }),
        adminApiClient.getAllUsers().catch((e: any) => {
          console.error("Users error:", e);
          return [];
        }),
        adminApiClient.getAllSubscriptions().catch((e: any) => {
          console.error("Subscriptions error:", e);
          return [];
        }),
      ]);
      
      setStats(statsData);
      
      if (usersData && Array.isArray(usersData)) {
        setUsers(usersData);
      }
      
      if (subscriptionsData && Array.isArray(subscriptionsData)) {
        setSubscriptions(subscriptionsData);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const handleLogout = useCallback(() => {
    adminApiClient.logout();
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  }, []);

  const handleSaveUser = useCallback(async (updates: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      const updated = await adminApiClient.updateUser(selectedUser.id, updates);
      setUsers(users.map(u => u.id === updated.id ? updated : u));
      setEditModalOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      alert(error.message || "Failed to update user");
    }
  }, [selectedUser, users]);

  if (loading && !stats) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <h1 className="logo">Rensights</h1>
            <p className="logo-subtitle">Admin Panel</p>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            {sidebarOpen && <span className="nav-text">Overview</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            {sidebarOpen && <span className="nav-text">Users</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <span className="nav-icon">💳</span>
            {sidebarOpen && <span className="nav-text">Subscriptions</span>}
          </button>
          <button
            className={`nav-item ${pathname === '/analysis-requests' ? 'active' : ''}`}
            onClick={() => router.push('/analysis-requests')}
          >
            <span className="nav-icon">📋</span>
            {sidebarOpen && <span className="nav-text">Analysis Requests</span>}
          </button>
          <button
            className={`nav-item ${pathname === '/deals' ? 'active' : ''}`}
            onClick={() => router.push('/deals')}
          >
            <span className="nav-icon">🔥</span>
            {sidebarOpen && <span className="nav-text">Today's Deals</span>}
          </button>
          <button
            className={`nav-item ${pathname === '/available-deals' ? 'active' : ''}`}
            onClick={() => router.push('/available-deals')}
          >
            <span className="nav-icon">✅</span>
            {sidebarOpen && <span className="nav-text">Available Deals</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn-sidebar">
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="page-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'subscriptions' && 'Subscription Management'}
            </h2>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-email">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {activeTab === 'overview' && stats && (
            <div className="overview-section">
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
            </div>
          )}

          {activeTab === 'users' && (
            <div className="table-section">
              <div className="table-header">
                <h3>All Users</h3>
                <div className="table-actions">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="search-input"
                  />
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Tier</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="email-cell">{user.email}</td>
                          <td>
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
                              : 'N/A'}
                          </td>
                          <td>
                            <span className={`badge ${
                              user.userTier === 'PREMIUM' ? 'badge-premium' :
                              user.userTier === 'ENTERPRISE' ? 'badge-enterprise' :
                              'badge-free'
                            }`}>
                              {user.userTier}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${user.isActive ? 'badge-active' : 'badge-inactive'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${user.emailVerified ? 'badge-verified' : 'badge-unverified'}`}>
                              {user.emailVerified ? '✓' : '✗'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="table-section">
              <div className="table-header">
                <h3>All Subscriptions</h3>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Email</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          No subscriptions found
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => (
                        <tr key={sub.id}>
                          <td className="email-cell">{sub.userId || 'N/A'}</td>
                          <td>
                            <span className={`badge ${
                              sub.planType === 'PREMIUM' ? 'badge-premium' :
                              sub.planType === 'ENTERPRISE' ? 'badge-enterprise' :
                              'badge-free'
                            }`}>
                              {sub.planType}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              sub.status === 'ACTIVE' ? 'badge-active' :
                              sub.status === 'CANCELLED' ? 'badge-cancelled' :
                              'badge-expired'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                          <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <button className="action-btn view-btn">View</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {editModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <UserEditForm
                user={selectedUser}
                onSave={handleSaveUser}
                onCancel={() => setEditModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Edit Form Component
function UserEditForm({ user, onSave, onCancel }: { user: User; onSave: (updates: Partial<User>) => void; onCancel: () => void }) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [userTier, setUserTier] = useState<User['userTier']>(user.userTier);
  const [isActive, setIsActive] = useState(user.isActive);
  const [emailVerified, setEmailVerified] = useState(user.emailVerified);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName,
      lastName,
      userTier,
      isActive,
      emailVerified,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="user-edit-form">
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={user.email} disabled className="form-input" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="form-input"
          />
        </div>
      </div>
      <div className="form-group">
        <label>User Tier</label>
        <select
          value={userTier}
          onChange={(e) => setUserTier(e.target.value as User['userTier'])}
          className="form-input"
        >
          <option value="FREE">FREE</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
      </div>
      <div className="form-row">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={emailVerified}
              onChange={(e) => setEmailVerified(e.target.checked)}
            />
            Email Verified
          </label>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  );
}
