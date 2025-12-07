"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, Deal } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import "../dashboard.css";

export default function DealsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [editingDeal, setEditingDeal] = useState<Partial<Deal>>({});
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [batchApproveConfirmOpen, setBatchApproveConfirmOpen] = useState(false);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getTodayPendingDeals(currentPage, 20);
      setDeals(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error("Error loading deals:", error);
      setError(error.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDeals();
  }, [pathname, router, currentPage, loadDeals]);

  const handleViewDetails = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    setDetailModalOpen(true);
  }, []);

  const handleEdit = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    setEditingDeal({
      name: deal.name,
      location: deal.location,
      city: deal.city,
      area: deal.area,
      bedrooms: deal.bedrooms,
      bedroomCount: deal.bedroomCount,
      size: deal.size,
      listedPrice: deal.listedPrice,
      priceValue: deal.priceValue,
      estimateRange: deal.estimateRange,
      discount: deal.discount,
      rentalYield: deal.rentalYield,
      buildingStatus: deal.buildingStatus,
    });
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedDeal) return;
    try {
      await adminApiClient.updateDeal(selectedDeal.id, editingDeal);
      await loadDeals();
      setEditModalOpen(false);
      setSelectedDeal(null);
      setEditingDeal({});
    } catch (error: any) {
      setError(error.message || "Failed to update deal");
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedDeal, editingDeal, loadDeals]);

  const handleApprove = useCallback(async () => {
    if (!selectedDeal) return;
    try {
      await adminApiClient.approveDeal(selectedDeal.id);
      setApproveConfirmOpen(false);
      setSelectedDeal(null);
      if (detailModalOpen) {
        setDetailModalOpen(false);
      }
      await loadDeals();
    } catch (error: any) {
      setError(error.message || "Failed to approve deal");
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedDeal, detailModalOpen, loadDeals]);

  const handleReject = useCallback(async () => {
    if (!selectedDeal) return;
    try {
      await adminApiClient.rejectDeal(selectedDeal.id);
      setRejectConfirmOpen(false);
      setSelectedDeal(null);
      if (detailModalOpen) {
        setDetailModalOpen(false);
      }
      await loadDeals();
    } catch (error: any) {
      setError(error.message || "Failed to reject deal");
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedDeal, detailModalOpen, loadDeals]);

  const handleSelectDeal = useCallback((dealId: string) => {
    setSelectedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedDeals.size === deals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(deals.map(d => d.id)));
    }
  }, [deals, selectedDeals]);

  const handleBatchApprove = useCallback(async () => {
    if (selectedDeals.size === 0) {
      setError("Please select at least one deal to approve");
      setTimeout(() => setError(null), 5000);
      return;
    }
    try {
      await adminApiClient.approveDeals(Array.from(selectedDeals));
      setBatchApproveConfirmOpen(false);
      setSelectedDeals(new Set());
      await loadDeals();
    } catch (error: any) {
      setError(error.message || "Failed to approve deals");
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedDeals, loadDeals]);

  if (loading && deals.length === 0) {
    return (
      <div className="dashboard-page">
        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading deals...</p>
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
            <h1>Today's Deals</h1>
            <p>Pending deals awaiting approval ({totalElements} total)</p>
          </div>
          <div className="header-actions">
            {selectedDeals.size > 0 && (
              <button 
                className="btn-primary" 
                onClick={() => setBatchApproveConfirmOpen(true)}
              >
                Approve Selected ({selectedDeals.size})
              </button>
            )}
            <button className="btn-secondary" onClick={handleSelectAll}>
              {selectedDeals.size === deals.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Filters - Removed for now as the API doesn't support city filtering for pending deals */}

        {/* Deals Table */}
        <div className="table-section">
          <div className="table-header">
            <h3>Pending Deals</h3>
            <div className="table-actions">
              <span className="pagination-info">
                Showing {deals.length > 0 ? currentPage * 20 + 1 : 0} - {Math.min((currentPage + 1) * 20, totalElements)} of {totalElements}
              </span>
            </div>
          </div>
          <div className="table-wrapper">
            {loading && deals.length === 0 ? (
              <div className="loading-container" style={{ padding: '60px' }}>
                <div className="spinner"></div>
                <p>Loading deals...</p>
              </div>
            ) : deals.length === 0 ? (
              <div className="empty-state">
                <div>No pending deals found for today</div>
                <p>Deals will appear here once they are imported from external sources</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedDeals.size === deals.length && deals.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Property Name</th>
                    <th>Location</th>
                    <th>City</th>
                    <th>Bedrooms</th>
                    <th>Size</th>
                    <th>Listed Price</th>
                    <th>Discount</th>
                    <th>Yield</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id}>
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedDeals.has(deal.id)}
                          onChange={() => handleSelectDeal(deal.id)}
                        />
                      </td>
                      <td>
                        <div className="deal-property-name">{deal.name || 'N/A'}</div>
                      </td>
                      <td>{deal.location || 'N/A'}</td>
                      <td>{deal.city || 'N/A'}</td>
                      <td>{deal.bedrooms || 'N/A'}</td>
                      <td>{deal.size || 'N/A'}</td>
                      <td>{deal.listedPrice || 'N/A'}</td>
                      <td>
                        <span className="status-badge discount">{deal.discount || 'N/A'}</span>
                      </td>
                      <td>{deal.rentalYield || 'N/A'}</td>
                      <td>
                        <span className="status-badge" style={{ background: '#f39c12', color: 'white' }}>
                          {deal.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-small view-btn" onClick={() => handleViewDetails(deal)}>
                            View
                          </button>
                          <button className="btn-small edit-btn" onClick={() => handleEdit(deal)}>
                            Edit
                          </button>
                          <button className="btn-small activate-btn" onClick={() => {
                            setSelectedDeal(deal);
                            setApproveConfirmOpen(true);
                          }}>
                            Approve
                          </button>
                          <button className="btn-small delete-btn" onClick={() => {
                            setSelectedDeal(deal);
                            setRejectConfirmOpen(true);
                          }}>
                            Reject
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
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage + 1} of {totalPages} ({totalElements} total)
            </span>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            >
              Next
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {detailModalOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                <h3>Deal Details</h3>
                <button className="modal-close" onClick={() => setDetailModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="deal-detail-grid">
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Property Name</div>
                    <div className="deal-detail-value">{selectedDeal.name || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Location</div>
                    <div className="deal-detail-value">{selectedDeal.location || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">City</div>
                    <div className="deal-detail-value">{selectedDeal.city || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Area</div>
                    <div className="deal-detail-value">{selectedDeal.area || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Bedrooms</div>
                    <div className="deal-detail-value">{selectedDeal.bedrooms || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Size</div>
                    <div className="deal-detail-value">{selectedDeal.size || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Listed Price</div>
                    <div className="deal-detail-value">{selectedDeal.listedPrice || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Price Value</div>
                    <div className="deal-detail-value">
                      {selectedDeal.priceValue ? `AED ${selectedDeal.priceValue.toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Estimate Range</div>
                    <div className="deal-detail-value">{selectedDeal.estimateRange || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Discount</div>
                    <div className="deal-detail-value">{selectedDeal.discount || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Rental Yield</div>
                    <div className="deal-detail-value">{selectedDeal.rentalYield || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Building Status</div>
                    <div className="deal-detail-value">{selectedDeal.buildingStatus || 'N/A'}</div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Status</div>
                    <div className="deal-detail-value">
                      <span className="status-badge" style={{ background: '#f39c12', color: 'white' }}>
                        {selectedDeal.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {selectedDeal.createdAt && (
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Created At</div>
                      <div className="deal-detail-value">
                        {new Date(selectedDeal.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setDetailModalOpen(false)}>
                  Close
                </button>
                <button className="btn-primary" onClick={() => {
                  setDetailModalOpen(false);
                  handleEdit(selectedDeal);
                }}>
                  Edit
                </button>
                <button className="btn-success" onClick={() => setApproveConfirmOpen(true)}>
                  Approve
                </button>
                <button className="btn-danger" onClick={() => setRejectConfirmOpen(true)}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h3>Edit Deal</h3>
                <button className="modal-close" onClick={() => setEditModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <form className="deal-edit-form" onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Property Name</label>
                      <input
                        type="text"
                        value={editingDeal.name || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        value={editingDeal.location || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={editingDeal.city || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Area</label>
                      <input
                        type="text"
                        value={editingDeal.area || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, area: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bedrooms</label>
                      <input
                        type="text"
                        value={editingDeal.bedrooms || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, bedrooms: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Size</label>
                      <input
                        type="text"
                        value={editingDeal.size || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, size: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Listed Price</label>
                      <input
                        type="text"
                        value={editingDeal.listedPrice || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, listedPrice: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Building Status</label>
                      <select
                        value={editingDeal.buildingStatus || 'READY'}
                        onChange={(e) => setEditingDeal({ ...editingDeal, buildingStatus: e.target.value as 'READY' | 'OFF_PLAN' })}
                      >
                        <option value="READY">Ready</option>
                        <option value="OFF_PLAN">Off-Plan</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Discount</label>
                      <input
                        type="text"
                        value={editingDeal.discount || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, discount: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Rental Yield</label>
                      <input
                        type="text"
                        value={editingDeal.rentalYield || ''}
                        onChange={(e) => setEditingDeal({ ...editingDeal, rentalYield: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Estimate Range</label>
                    <input
                      type="text"
                      value={editingDeal.estimateRange || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, estimateRange: e.target.value })}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {approveConfirmOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setApproveConfirmOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Confirm Approval</h3>
                <button className="modal-close" onClick={() => setApproveConfirmOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                  Are you sure you want to approve <strong>{selectedDeal.name || 'this deal'}</strong>?
                </p>
                <p style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.9rem' }}>
                  This deal will become available to users.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setApproveConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="btn-success" onClick={handleApprove}>
                  Approve Deal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {rejectConfirmOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setRejectConfirmOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Confirm Rejection</h3>
                <button className="modal-close" onClick={() => setRejectConfirmOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                  Are you sure you want to reject <strong>{selectedDeal.name || 'this deal'}</strong>?
                </p>
                <p style={{ color: '#e74c3c', fontWeight: '600', fontSize: '0.9rem' }}>
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setRejectConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleReject}>
                  Reject Deal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Approve Confirmation Modal */}
        {batchApproveConfirmOpen && selectedDeals.size > 0 && (
          <div className="modal-overlay" onClick={() => setBatchApproveConfirmOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Confirm Batch Approval</h3>
                <button className="modal-close" onClick={() => setBatchApproveConfirmOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                  Are you sure you want to approve <strong>{selectedDeals.size} deal(s)</strong>?
                </p>
                <p style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.9rem' }}>
                  All selected deals will become available to users.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setBatchApproveConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="btn-success" onClick={handleBatchApprove}>
                  Approve All
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
