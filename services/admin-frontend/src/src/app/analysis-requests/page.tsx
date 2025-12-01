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

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadRequests();
  }, [router, currentPage, statusFilter]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getAllAnalysisRequests(currentPage, 20);
      let filtered = response.content;
      
      if (statusFilter !== "ALL") {
        filtered = filtered.filter(r => r.status === statusFilter);
      }
      
      setRequests(filtered);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error("Error loading analysis requests:", error);
      setError(error.message || "Failed to load analysis requests");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

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
            {sidebarOpen && <span className="nav-text">Dashboard</span>}
          </button>
          <button
            className={`nav-item ${pathname === '/analysis-requests' ? 'active' : ''}`}
            onClick={() => router.push('/analysis-requests')}
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

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Analysis Requests</h1>
          <div className="header-actions">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ margin: '20px', padding: '12px', background: '#fee', color: '#c33', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div className="table-container">
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
                    <td>{request.id.substring(0, 8)}...</td>
                    <td>{request.email}</td>
                    <td>
                      <div><strong>{request.buildingName}</strong></div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {request.propertyType} • {request.bedrooms} bed
                      </div>
                    </td>
                    <td>{request.city}, {request.area}</td>
                    <td>{request.askingPrice}</td>
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
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
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

        {detailModalOpen && selectedRequest && (
          <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h2>Analysis Request Details</h2>
                <button onClick={() => setDetailModalOpen(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '20px' }}>
                  <label>Status:</label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    style={{ marginLeft: '10px', padding: '6px', borderRadius: '4px' }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="detail-section">
                  <h3>Contact Information</h3>
                  <p><strong>Email:</strong> {selectedRequest.email}</p>
                  {selectedRequest.userId && <p><strong>User ID:</strong> {selectedRequest.userId}</p>}
                </div>

                <div className="detail-section">
                  <h3>Property Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <p><strong>City:</strong> {selectedRequest.city}</p>
                    <p><strong>Area:</strong> {selectedRequest.area}</p>
                    <p><strong>Building:</strong> {selectedRequest.buildingName}</p>
                    <p><strong>Type:</strong> {selectedRequest.propertyType}</p>
                    <p><strong>Bedrooms:</strong> {selectedRequest.bedrooms}</p>
                    <p><strong>Size:</strong> {selectedRequest.size} sq ft</p>
                    {selectedRequest.plotSize && <p><strong>Plot Size:</strong> {selectedRequest.plotSize} sq ft</p>}
                    <p><strong>Status:</strong> {selectedRequest.buildingStatus}</p>
                    <p><strong>Condition:</strong> {selectedRequest.condition}</p>
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

                <div className="detail-section">
                  <h3>Financial Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <p><strong>Asking Price:</strong> {selectedRequest.askingPrice}</p>
                    {selectedRequest.serviceCharge && <p><strong>Service Charge:</strong> {selectedRequest.serviceCharge}</p>}
                    {selectedRequest.handoverDate && <p><strong>Handover Date:</strong> {selectedRequest.handoverDate}</p>}
                    {selectedRequest.developer && <p><strong>Developer:</strong> {selectedRequest.developer}</p>}
                    {selectedRequest.paymentPlan && <p><strong>Payment Plan:</strong> {selectedRequest.paymentPlan}</p>}
                  </div>
                </div>

                {selectedRequest.features && selectedRequest.features.length > 0 && (
                  <div className="detail-section">
                    <h3>Features</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedRequest.features.map((feature, idx) => (
                        <span key={idx} style={{ padding: '4px 8px', background: '#e8f4f8', borderRadius: '4px' }}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.additionalNotes && (
                  <div className="detail-section">
                    <h3>Additional Notes</h3>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.additionalNotes}</p>
                  </div>
                )}

                {selectedRequest.filePaths && selectedRequest.filePaths.length > 0 && (
                  <div className="detail-section">
                    <h3>Attached Files ({selectedRequest.filePaths.length})</h3>
                    <ul>
                      {selectedRequest.filePaths.map((path, idx) => (
                        <li key={idx}>
                          <a href={`${MAIN_BACKEND_URL}/api/analysis-requests/files/${encodeURIComponent(path)}`} target="_blank" rel="noopener noreferrer">
                            {path.split('/').pop()}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Timestamps</h3>
                  <p><strong>Created:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  <p><strong>Updated:</strong> {new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setDetailModalOpen(false)} className="btn">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const MAIN_BACKEND_URL = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8080';

