"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, User, Subscription, DashboardStats, UpdateUserRequest } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
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
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [subscriptionPage, setSubscriptionPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [subscriptionTotalPages, setSubscriptionTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [pathname, router, currentPage, subscriptionPage, loadData]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, subscriptionsData] = await Promise.all([
        adminApiClient.getDashboardStats().catch((e) => {
          console.error("Stats error:", e);
          return null;
        }),
        adminApiClient.getAllUsers(currentPage, 20).catch((e: any) => {
          console.error("Users error:", e);
          return { content: [], totalElements: 0, totalPages: 0 };
        }),
        adminApiClient.getAllSubscriptions(subscriptionPage, 20).catch((e: any) => {
          console.error("Subscriptions error:", e);
          return { content: [], totalElements: 0, totalPages: 0 };
        }),
      ]);
      
      setStats(statsData);
      
      if (usersData && usersData.content && Array.isArray(usersData.content)) {
        setUsers(usersData.content);
        setTotalPages(usersData.totalPages || 1);
      } else if (Array.isArray(usersData)) {
        // Fallback for non-paginated response
        setUsers(usersData);
        setTotalPages(1);
      }
      
      if (subscriptionsData && subscriptionsData.content && Array.isArray(subscriptionsData.content)) {
        setSubscriptions(subscriptionsData.content);
        setSubscriptionTotalPages(subscriptionsData.totalPages || 1);
        console.log("Subscriptions loaded:", subscriptionsData.content.length);
      } else if (Array.isArray(subscriptionsData)) {
        // Fallback for non-paginated response
        setSubscriptions(subscriptionsData);
        setSubscriptionTotalPages(1);
        console.log("Subscriptions loaded (array):", subscriptionsData.length);
      } else {
        // If subscriptionsData is null or unexpected format, set empty array
        console.warn("Subscriptions data is null or unexpected format:", subscriptionsData);
        setSubscriptions([]);
        setSubscriptionTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [currentPage, subscriptionPage]);

  const handleLogout = useCallback(() => {
    adminApiClient.logout();
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  }, []);

  const handleSaveUser = useCallback(async (updates: UpdateUserRequest) => {
    if (!selectedUser) return;
    
    try {
      const updated = await adminApiClient.updateUser(selectedUser.id, updates);
      setUsers(users.map(u => u.id === updated.id ? updated : u));
      setEditModalOpen(false);
      setSelectedUser(null);
      setSuccessMessage("User updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData(); // Reload to update stats
    } catch (error: any) {
      setError(error.message || "Failed to update user");
    }
  }, [selectedUser, users, loadData]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    
    try {
      await adminApiClient.deleteUser(selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setDeleteConfirmOpen(false);
      setSelectedUser(null);
      setSuccessMessage("User deactivated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData(); // Reload to update stats
    } catch (error: any) {
      setError(error.message || "Failed to delete user");
    }
  }, [selectedUser, users, loadData]);

  const handleViewSubscription = useCallback(async (subscription: Subscription) => {
    try {
      const fullSubscription = await adminApiClient.getSubscriptionById(subscription.id);
      setSelectedSubscription(fullSubscription);
      setSubscriptionModalOpen(true);
    } catch (error: any) {
      setError(error.message || "Failed to load subscription details");
    }
  }, []);

  const handleCancelSubscription = useCallback(async () => {
    if (!selectedSubscription) return;
    
    try {
      const cancelled = await adminApiClient.cancelSubscription(selectedSubscription.id);
      setSubscriptions(subscriptions.map(s => s.id === cancelled.id ? cancelled : s));
      setCancelConfirmOpen(false);
      setSelectedSubscription(cancelled);
      setSuccessMessage("Subscription cancelled successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData(); // Reload to update stats
    } catch (error: any) {
      setError(error.message || "Failed to cancel subscription");
    }
  }, [selectedSubscription, subscriptions, loadData]);

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
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Dashboard Tabs Navigation */}
      <div className="dashboard-tabs" style={{ 
        position: 'fixed', 
        left: sidebarOpen ? '280px' : '80px', 
        top: '80px', 
        right: '0', 
        background: 'rgba(255, 255, 255, 0.98)', 
        padding: '16px 32px', 
        borderBottom: '1px solid #f0f0f0',
        zIndex: 90,
        transition: 'left 0.3s ease'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'overview' ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'white',
              color: activeTab === 'overview' ? 'white' : '#555',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'users' ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'white',
              color: activeTab === 'users' ? 'white' : '#555',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'subscriptions' ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'white',
              color: activeTab === 'subscriptions' ? 'white' : '#555',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Subscriptions
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ marginTop: '140px' }}>
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

          {successMessage && (
            <div className="success-banner">
              <span>✅</span>
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)}>×</button>
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
                {stats.activeUsers !== undefined && (
                  <div className="stat-card primary">
                    <div className="stat-icon">✓</div>
                    <div className="stat-content">
                      <div className="stat-label">Active Users</div>
                      <div className="stat-value">{stats.activeUsers.toLocaleString()}</div>
                    </div>
                  </div>
                )}
                {stats.verifiedUsers !== undefined && (
                  <div className="stat-card success">
                    <div className="stat-icon">✉️</div>
                    <div className="stat-content">
                      <div className="stat-label">Verified Users</div>
                      <div className="stat-value">{stats.verifiedUsers.toLocaleString()}</div>
                    </div>
                  </div>
                )}
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
                            <div className="action-buttons">
                              <button 
                                className="action-btn edit-btn"
                                onClick={() => handleEditUser(user)}
                              >
                                Edit
                              </button>
                              <button 
                                className="action-btn delete-btn"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                Delete
                              </button>
                            </div>
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
                {loading && subscriptions.length === 0 && (
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                    Loading subscriptions...
                  </div>
                )}
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
                    {loading && subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state" style={{ padding: '40px' }}>
                          <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                          Loading subscriptions...
                        </td>
                      </tr>
                    ) : subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          No subscriptions found
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => (
                        <tr key={sub.id}>
                          <td className="email-cell">{sub.userEmail || sub.userId || 'N/A'}</td>
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
                            <div className="action-buttons">
                              <button 
                                className="action-btn view-btn"
                                onClick={() => handleViewSubscription(sub)}
                              >
                                View
                              </button>
                              {sub.status === 'ACTIVE' && (
                                <button 
                                  className="action-btn cancel-btn"
                                  onClick={() => {
                                    setSelectedSubscription(sub);
                                    setCancelConfirmOpen(true);
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {subscriptionTotalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setSubscriptionPage(p => Math.max(0, p - 1))}
                    disabled={subscriptionPage === 0}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {subscriptionPage + 1} of {subscriptionTotalPages}
                  </span>
                  <button
                    onClick={() => setSubscriptionPage(p => Math.min(subscriptionTotalPages - 1, p + 1))}
                    disabled={subscriptionPage >= subscriptionTotalPages - 1}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
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

      {/* Subscription Details Modal */}
      {subscriptionModalOpen && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setSubscriptionModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Subscription Details</h3>
              <button className="modal-close" onClick={() => setSubscriptionModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-view">
                <div className="detail-row">
                  <span className="detail-label">Subscription ID:</span>
                  <span className="detail-value">{selectedSubscription.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User Email:</span>
                  <span className="detail-value">{selectedSubscription.userEmail || selectedSubscription.userId || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plan Type:</span>
                  <span className={`badge ${
                    selectedSubscription.planType === 'PREMIUM' ? 'badge-premium' :
                    selectedSubscription.planType === 'ENTERPRISE' ? 'badge-enterprise' :
                    'badge-free'
                  }`}>
                    {selectedSubscription.planType}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`badge ${
                    selectedSubscription.status === 'ACTIVE' ? 'badge-active' :
                    selectedSubscription.status === 'CANCELLED' ? 'badge-cancelled' :
                    'badge-expired'
                  }`}>
                    {selectedSubscription.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{new Date(selectedSubscription.startDate).toLocaleString()}</span>
                </div>
                {selectedSubscription.endDate && (
                  <div className="detail-row">
                    <span className="detail-label">End Date:</span>
                    <span className="detail-value">{new Date(selectedSubscription.endDate).toLocaleString()}</span>
                  </div>
                )}
                {selectedSubscription.createdAt && (
                  <div className="detail-row">
                    <span className="detail-label">Created At:</span>
                    <span className="detail-value">{new Date(selectedSubscription.createdAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedSubscription.stripeSubscriptionId && (
                  <div className="detail-row">
                    <span className="detail-label">Stripe Subscription ID:</span>
                    <span className="detail-value">{selectedSubscription.stripeSubscriptionId}</span>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setSubscriptionModalOpen(false)} 
                  className="btn-secondary"
                >
                  Close
                </button>
                {selectedSubscription.status === 'ACTIVE' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSubscriptionModalOpen(false);
                      setCancelConfirmOpen(true);
                    }}
                    className="btn-danger"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirmOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to deactivate user <strong>{selectedUser.email}</strong>? This action cannot be undone.</p>
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setSelectedUser(null);
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteUser}
                  className="btn-danger"
                >
                  Deactivate User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {cancelConfirmOpen && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setCancelConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Cancellation</h3>
              <button className="modal-close" onClick={() => setCancelConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel the subscription for <strong>{selectedSubscription.userEmail || selectedSubscription.userId}</strong>? The user will be downgraded to FREE tier.</p>
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setCancelConfirmOpen(false);
                    setSelectedSubscription(null);
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelSubscription}
                  className="btn-danger"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Edit Form Component
function UserEditForm({ user, onSave, onCancel }: { user: User; onSave: (updates: UpdateUserRequest) => void; onCancel: () => void }) {
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
