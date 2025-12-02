"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, Deal, PaginatedResponse } from "@/lib/api";
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
  const [cityFilter, setCityFilter] = useState<string>("");
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [editingDeal, setEditingDeal] = useState<Partial<Deal>>({});

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDeals();
  }, [router, currentPage, cityFilter]);

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
  }, [currentPage, cityFilter]);

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
      alert(error.message || "Failed to update deal");
    }
  }, [selectedDeal, editingDeal, loadDeals]);

  const handleApprove = useCallback(async (dealId: string) => {
    try {
      await adminApiClient.approveDeal(dealId);
      await loadDeals();
      if (selectedDeal?.id === dealId) {
        setDetailModalOpen(false);
        setSelectedDeal(null);
      }
    } catch (error: any) {
      alert(error.message || "Failed to approve deal");
    }
  }, [loadDeals, selectedDeal]);

  const handleReject = useCallback(async (dealId: string) => {
    if (!confirm("Are you sure you want to reject this deal?")) return;
    try {
      await adminApiClient.rejectDeal(dealId);
      await loadDeals();
      if (selectedDeal?.id === dealId) {
        setDetailModalOpen(false);
        setSelectedDeal(null);
      }
    } catch (error: any) {
      alert(error.message || "Failed to reject deal");
    }
  }, [loadDeals, selectedDeal]);

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
      alert("Please select at least one deal to approve");
      return;
    }
    if (!confirm(`Are you sure you want to approve ${selectedDeals.size} deal(s)?`)) return;
    try {
      await adminApiClient.approveDeals(Array.from(selectedDeals));
      setSelectedDeals(new Set());
      await loadDeals();
    } catch (error: any) {
      alert(error.message || "Failed to approve deals");
    }
  }, [selectedDeals, loadDeals]);


  if (loading && deals.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="page-header">
          <h1>Today's Deals ({totalElements})</h1>
          <div className="header-actions">
            {selectedDeals.size > 0 && (
              <button className="btn-primary" onClick={handleBatchApprove}>
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
            {error}
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
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
              {loading && deals.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-container">
                      <div className="spinner"></div>
                      <p>Loading deals...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
                    {error}
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-state">
                    <div>No pending deals found for today</div>
                    <p>Deals will appear here once they are imported from external sources</p>
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedDeals.has(deal.id)}
                        onChange={() => handleSelectDeal(deal.id)}
                      />
                    </td>
                    <td>{deal.name || 'N/A'}</td>
                    <td>{deal.location || 'N/A'}</td>
                    <td>{deal.city || 'N/A'}</td>
                    <td>{deal.bedrooms || 'N/A'}</td>
                    <td>{deal.size || 'N/A'}</td>
                    <td>{deal.listedPrice || 'N/A'}</td>
                    <td>{deal.discount || 'N/A'}</td>
                    <td>{deal.rentalYield || 'N/A'}</td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: '#f39c12' }}>
                        {deal.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-small" onClick={() => handleViewDetails(deal)}>
                          View
                        </button>
                        <button className="btn-small" onClick={() => handleEdit(deal)}>
                          Edit
                        </button>
                        <button className="btn-small btn-success" onClick={() => handleApprove(deal.id)}>
                          Approve
                        </button>
                        <button className="btn-small btn-danger" onClick={() => handleReject(deal.id)}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          >
            Next
          </button>
        </div>

        {/* Detail Modal */}
        {detailModalOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Deal Details</h2>
                <button className="modal-close" onClick={() => setDetailModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <strong>Property Name:</strong> {selectedDeal.name || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Location:</strong> {selectedDeal.location || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>City:</strong> {selectedDeal.city || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Area:</strong> {selectedDeal.area || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Bedrooms:</strong> {selectedDeal.bedrooms || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Size:</strong> {selectedDeal.size || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Listed Price:</strong> {selectedDeal.listedPrice || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Price Value:</strong> {selectedDeal.priceValue ? `AED ${selectedDeal.priceValue.toLocaleString()}` : 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Estimate Range:</strong> {selectedDeal.estimateRange || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Discount:</strong> {selectedDeal.discount || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Rental Yield:</strong> {selectedDeal.rentalYield || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Building Status:</strong> {selectedDeal.buildingStatus || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> {selectedDeal.status || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Created At:</strong> {selectedDeal.createdAt ? new Date(selectedDeal.createdAt).toLocaleString() : 'N/A'}
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
                <button className="btn-success" onClick={() => handleApprove(selectedDeal.id)}>
                  Approve
                </button>
                <button className="btn-danger" onClick={() => handleReject(selectedDeal.id)}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Deal</h2>
                <button className="modal-close" onClick={() => setEditModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Property Name:</label>
                  <input
                    type="text"
                    value={editingDeal.name || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Location:</label>
                  <input
                    type="text"
                    value={editingDeal.location || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>City:</label>
                  <input
                    type="text"
                    value={editingDeal.city || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Area:</label>
                  <input
                    type="text"
                    value={editingDeal.area || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, area: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Bedrooms:</label>
                  <input
                    type="text"
                    value={editingDeal.bedrooms || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, bedrooms: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Size:</label>
                  <input
                    type="text"
                    value={editingDeal.size || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, size: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Listed Price:</label>
                  <input
                    type="text"
                    value={editingDeal.listedPrice || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, listedPrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Estimate Range:</label>
                  <input
                    type="text"
                    value={editingDeal.estimateRange || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, estimateRange: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Discount:</label>
                  <input
                    type="text"
                    value={editingDeal.discount || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, discount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Rental Yield:</label>
                  <input
                    type="text"
                    value={editingDeal.rentalYield || ''}
                    onChange={(e) => setEditingDeal({ ...editingDeal, rentalYield: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Building Status:</label>
                  <select
                    value={editingDeal.buildingStatus || 'READY'}
                    onChange={(e) => setEditingDeal({ ...editingDeal, buildingStatus: e.target.value as 'READY' | 'OFF_PLAN' })}
                  >
                    <option value="READY">Ready</option>
                    <option value="OFF_PLAN">Off-Plan</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

