"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, AnalysisRequest, PaginatedResponse } from "@/lib/api";
import "../dashboard.css";

export default function AnalysisRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AnalysisRequest | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getAllAnalysisRequests(currentPage, 20);
      let filtered = response?.content || [];
      
      if (statusFilter !== "ALL") {
        filtered = filtered.filter(r => r.status === statusFilter);
      }
      
      setRequests(filtered);
      setTotalPages(response?.totalPages || 1);
      setTotalElements(response?.totalElements || 0);
    } catch (error: any) {
      console.error("Error loading analysis requests:", error);
      setError(error.message || "Failed to load analysis requests");
      setRequests([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadRequests();
  }, [router, loadRequests]);

  const handleViewDetails = useCallback((request: AnalysisRequest) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
  }, []);

  const handleUpdateStatus = useCallback(async (requestId: string, newStatus: string) => {
    try {
      await adminApiClient.updateAnalysisRequestStatus(requestId, newStatus);
      await loadRequests();
      if (selectedRequest?.id === requestId) {
        const updated = await adminApiClient.getAnalysisRequestById(requestId);
        setSelectedRequest(updated);
      }
    } catch (error: any) {
      alert(error.message || "Failed to update status");
    }
  }, [loadRequests, selectedRequest]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f39c12';
      case 'IN_PROGRESS': return '#3498db';
      case 'COMPLETED': return '#27ae60';
      case 'CANCELLED': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const handleLogout = () => {
    adminApiClient.logout();
  };

  if (loading && requests.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading analysis requests...</p>
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
            className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => router.push('/dashboard')}
          >
            <span className="nav-icon">📊</span>
            {sidebarOpen && <span className="nav-text">Overview</span>}
          </button>
          <button
            className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => router.push('/dashboard')}
          >
            <span className="nav-icon">👥</span>
            {sidebarOpen && <span className="nav-text">Users</span>}
          </button>
          <button
            className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => router.push('/dashboard')}
          >
            <span className="nav-icon">💳</span>
            {sidebarOpen && <span className="nav-text">Subscriptions</span>}
          </button>
          <button
            className={`nav-item ${pathname === '/analysis-requests' ? 'active' : ''}`}
            onClick={() => {
              try {
                router.push('/analysis-requests');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <span className="nav-icon">📋</span>
            {sidebarOpen && <span className="nav-text">Analysis Requests</span>}
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
            <h2 className="page-title">Analysis Requests</h2>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="form-input"
                style={{ minWidth: '150px' }}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
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

          <div className="table-section">
            <div className="table-header">
              <h3>All Analysis Requests</h3>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Property</th>
                <th>Location</th>
                <th>Asking Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    No analysis requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id ? request.id.substring(0, 8) + '...' : 'N/A'}</td>
                    <td>{request.email || 'N/A'}</td>
                    <td>
                      <div><strong>{request.buildingName || 'N/A'}</strong></div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {request.propertyType || 'N/A'} • {request.bedrooms || 'N/A'} bed
                      </div>
                    </td>
                    <td>{request.city || 'N/A'}, {request.area || 'N/A'}</td>
                    <td>{request.askingPrice || 'N/A'}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: getStatusColor(request.status) + '20',
                          color: getStatusColor(request.status),
                          fontWeight: '600',
                          fontSize: '0.85em'
                        }}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="btn btn-sm"
                        style={{ marginRight: '8px' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="btn btn-sm"
              >
                Previous
              </button>
              <span>
                Page {currentPage + 1} of {totalPages} (Total: {totalElements})
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {detailModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>Analysis Request Details</h3>
              <button className="modal-close" onClick={() => setDetailModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Status:</label>
                <select
                  value={selectedRequest.status}
                  onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                  className="form-input"
                  style={{ width: '200px' }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="detail-section" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50', marginBottom: '16px' }}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Email:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.email || 'N/A'}</span></p>
                  {selectedRequest.userId && <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>User ID:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.userId}</span></p>}
                </div>
              </div>

              <div className="detail-section" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50', marginBottom: '16px' }}>Property Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>City:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.city || 'N/A'}</span></p>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Area:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.area || 'N/A'}</span></p>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Building:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.buildingName || 'N/A'}</span></p>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Type:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.propertyType || 'N/A'}</span></p>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Bedrooms:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.bedrooms || 'N/A'}</span></p>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Size:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.size ? `${selectedRequest.size} sq ft` : 'N/A'}</span></p>
                  {selectedRequest.plotSize && <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Plot Size:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.plotSize} sq ft</span></p>}
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Status:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.buildingStatus || 'N/A'}</span></p>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Condition:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.condition || 'N/A'}</span></p>
                </div>
                  {selectedRequest.listingUrl && (
                    <p><strong>Listing URL:</strong> <a href={selectedRequest.listingUrl} target="_blank" rel="noopener noreferrer">{selectedRequest.listingUrl}</a></p>
                  )}
                  {selectedRequest.latitude && selectedRequest.longitude && (
                    <p>
                      <strong>Location:</strong> {selectedRequest.latitude}, {selectedRequest.longitude}
                      {' '}
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selectedRequest.latitude}&mlon=${selectedRequest.longitude}&zoom=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Map
                      </a>
                    </p>
                  )}
                </div>

              <div className="detail-section" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50', marginBottom: '16px' }}>Financial Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Asking Price:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.askingPrice || 'N/A'}</span></p>
                  {selectedRequest.serviceCharge && <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Service Charge:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.serviceCharge}</span></p>}
                  {selectedRequest.handoverDate && <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Handover Date:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.handoverDate}</span></p>}
                  {selectedRequest.developer && <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Developer:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.developer}</span></p>}
                  {selectedRequest.paymentPlan && <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Payment Plan:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.paymentPlan}</span></p>}
                </div>
              </div>

              {selectedRequest.features && selectedRequest.features.length > 0 && (
                <div className="detail-section" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50', marginBottom: '16px' }}>Features</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedRequest.features.map((feature, idx) => (
                      <span key={idx} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(230, 126, 34, 0.1))', borderRadius: '6px', color: '#e67e22', fontWeight: '500', fontSize: '0.9rem' }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.additionalNotes && (
                <div className="detail-section" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50', marginBottom: '16px' }}>Additional Notes</h3>
                  <p style={{ whiteSpace: 'pre-wrap', padding: '12px', background: '#f8f9fa', borderRadius: '8px', color: '#2c3e50', lineHeight: '1.6' }}>{selectedRequest.additionalNotes}</p>
                </div>
              )}

              {selectedRequest.filePaths && selectedRequest.filePaths.length > 0 && (
                <div className="detail-section" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50', marginBottom: '16px' }}>Attached Files ({selectedRequest.filePaths.length})</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {selectedRequest.filePaths.map((path, idx) => (
                      <li key={idx} style={{ margin: '8px 0', padding: '8px 12px', background: '#f8f9fa', borderRadius: '6px' }}>
                        <a 
                          href={`${MAIN_BACKEND_URL}/api/analysis-requests/files/${encodeURIComponent(path)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#e67e22', textDecoration: 'none', fontWeight: '500' }}
                        >
                          📎 {path.split('/').pop()}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-section" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50', marginBottom: '16px' }}>Timestamps</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Created:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}</span></p>
                  <p style={{ margin: '8px 0' }}><strong style={{ color: '#555' }}>Updated:</strong> <span style={{ color: '#2c3e50' }}>{selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString() : 'N/A'}</span></p>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '20px 28px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailModalOpen(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const MAIN_BACKEND_URL = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8080';

