"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, AnalysisRequest } from "@/lib/api";
import "../../dashboard.css";

const MAIN_BACKEND_URL = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8080';

export default function AnalysisRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
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
  }, [pathname, router, currentPage, statusFilter, loadRequests]);

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
      setError(error.message || "Failed to update status");
      setTimeout(() => setError(null), 5000);
    }
  }, [loadRequests, selectedRequest]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'status-badge-pending';
      case 'IN_PROGRESS': return 'status-badge-in-progress';
      case 'COMPLETED': return 'status-badge-completed';
      case 'CANCELLED': return 'status-badge-cancelled';
      default: return 'status-badge';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading analysis requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Analysis Requests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage property analysis requests from users ({totalElements} total)</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="table-section">
          <div className="table-header">
            <h3>All Analysis Requests</h3>
            <div className="table-actions">
              <span className="pagination-info">
                Showing {requests.length > 0 ? currentPage * 20 + 1 : 0} - {Math.min((currentPage + 1) * 20, totalElements)} of {totalElements}
              </span>
            </div>
          </div>
          <div className="table-wrapper">
            {loading && requests.length === 0 ? (
              <div className="loading-container" style={{ padding: '60px' }}>
                <div className="spinner"></div>
                <p>Loading analysis requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <div>No analysis requests found</div>
                <p>Requests will appear here when users submit property analysis requests</p>
              </div>
            ) : (
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
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="request-id-cell">
                        {request.id ? request.id.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="email-cell">{request.email || 'N/A'}</td>
                      <td>
                        <div className="deal-property-name">{request.buildingName || 'N/A'}</div>
                        <div className="deal-property-meta">
                          {request.propertyType || 'N/A'} • {request.bedrooms || 'N/A'} bed
                        </div>
                      </td>
                      <td>
                        {request.city || 'N/A'}{request.area ? `, ${request.area}` : ''}
                      </td>
                      <td>{request.askingPrice || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-small view-btn"
                            onClick={() => handleViewDetails(request)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage + 1} of {totalPages} (Total: {totalElements})
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {detailModalOpen && selectedRequest && (
          <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h3>Analysis Request Details</h3>
                <button className="modal-close" onClick={() => setDetailModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                {/* Status Update */}
                <div className="status-update-section">
                  <label className="form-group-label">Status:</label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    className="form-input status-select"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Contact Information */}
                <div className="detail-section">
                  <h4 className="detail-section-title">Contact Information</h4>
                  <div className="deal-detail-grid">
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Email</div>
                      <div className="deal-detail-value">{selectedRequest.email || 'N/A'}</div>
                    </div>
                    {selectedRequest.userId && (
                      <div className="deal-detail-item">
                        <div className="deal-detail-label">User ID</div>
                        <div className="deal-detail-value">{selectedRequest.userId}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Information */}
                <div className="detail-section">
                  <h4 className="detail-section-title">Property Information</h4>
                  <div className="deal-detail-grid">
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">City</div>
                      <div className="deal-detail-value">{selectedRequest.city || 'N/A'}</div>
                    </div>
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Area</div>
                      <div className="deal-detail-value">{selectedRequest.area || 'N/A'}</div>
                    </div>
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Building</div>
                      <div className="deal-detail-value">{selectedRequest.buildingName || 'N/A'}</div>
                    </div>
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Type</div>
                      <div className="deal-detail-value">{selectedRequest.propertyType || 'N/A'}</div>
                    </div>
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Bedrooms</div>
                      <div className="deal-detail-value">{selectedRequest.bedrooms || 'N/A'}</div>
                    </div>
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Size</div>
                      <div className="deal-detail-value">
                        {selectedRequest.size ? `${selectedRequest.size} sq ft` : 'N/A'}
                      </div>
                    </div>
                    {selectedRequest.plotSize && (
                      <div className="deal-detail-item">
                        <div className="deal-detail-label">Plot Size</div>
                        <div className="deal-detail-value">{selectedRequest.plotSize} sq ft</div>
                      </div>
                    )}
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Status</div>
                      <div className="deal-detail-value">{selectedRequest.buildingStatus || 'N/A'}</div>
                    </div>
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Condition</div>
                      <div className="deal-detail-value">{selectedRequest.condition || 'N/A'}</div>
                    </div>
                  </div>
                  {selectedRequest.listingUrl && (
                    <div className="link-item">
                      <strong>Listing URL:</strong>{' '}
                      <a href={selectedRequest.listingUrl} target="_blank" rel="noopener noreferrer" className="external-link">
                        {selectedRequest.listingUrl}
                      </a>
                    </div>
                  )}
                  {selectedRequest.latitude && selectedRequest.longitude && (
                    <div className="link-item">
                      <strong>Location:</strong>{' '}
                      {selectedRequest.latitude}, {selectedRequest.longitude}{' '}
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selectedRequest.latitude}&mlon=${selectedRequest.longitude}&zoom=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                </div>

                {/* Financial Information */}
                <div className="detail-section">
                  <h4 className="detail-section-title">Financial Information</h4>
                  <div className="deal-detail-grid">
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Asking Price</div>
                      <div className="deal-detail-value">{selectedRequest.askingPrice || 'N/A'}</div>
                    </div>
                    {selectedRequest.serviceCharge && (
                      <div className="deal-detail-item">
                        <div className="deal-detail-label">Service Charge</div>
                        <div className="deal-detail-value">{selectedRequest.serviceCharge}</div>
                      </div>
                    )}
                    {selectedRequest.handoverDate && (
                      <div className="deal-detail-item">
                        <div className="deal-detail-label">Handover Date</div>
                        <div className="deal-detail-value">{selectedRequest.handoverDate}</div>
                      </div>
                    )}
                    {selectedRequest.developer && (
                      <div className="deal-detail-item">
                        <div className="deal-detail-label">Developer</div>
                        <div className="deal-detail-value">{selectedRequest.developer}</div>
                      </div>
                    )}
                    {selectedRequest.paymentPlan && (
                      <div className="deal-detail-item">
                        <div className="deal-detail-label">Payment Plan</div>
                        <div className="deal-detail-value">{selectedRequest.paymentPlan}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                {selectedRequest.features && selectedRequest.features.length > 0 && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">Features</h4>
                    <div className="features-list">
                      {selectedRequest.features.map((feature, idx) => (
                        <span key={idx} className="feature-badge">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {selectedRequest.additionalNotes && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">Additional Notes</h4>
                    <div className="notes-content">
                      {selectedRequest.additionalNotes}
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {selectedRequest.filePaths && selectedRequest.filePaths.length > 0 && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">Attached Files ({selectedRequest.filePaths.length})</h4>
                    <div className="files-list">
                      {selectedRequest.filePaths.map((path, idx) => (
                        <a
                          key={idx}
                          href={`${MAIN_BACKEND_URL}/api/analysis-requests/files/${encodeURIComponent(path)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          📎 {path.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="detail-section">
                  <h4 className="detail-section-title">Timestamps</h4>
                  <div className="deal-detail-grid">
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Created</div>
                      <div className="deal-detail-value">
                        {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Updated</div>
                      <div className="deal-detail-value">
                        {selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setDetailModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
