"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, Deal } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import "../dashboard.css";

export default function AvailableDealsPage() {
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
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [editingDeal, setEditingDeal] = useState<Partial<Deal>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getApprovedDeals(
        currentPage,
        20,
        cityFilter || undefined,
        activeFilter
      );
      setDeals(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error("Error loading deals:", error);
      setError(error.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [currentPage, cityFilter, activeFilter]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDeals();
  }, [pathname, router, currentPage, cityFilter, activeFilter, loadDeals]);

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
      estimateMin: deal.estimateMin,
      estimateMax: deal.estimateMax,
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
      setEditModalOpen(false);
      setSelectedDeal(null);
      setEditingDeal({});
      await loadDeals();
    } catch (error: any) {
      setError(error.message || "Failed to update deal");
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedDeal, editingDeal, loadDeals]);

  const handleDelete = useCallback(async () => {
    if (!selectedDeal) return;
    try {
      await adminApiClient.deleteDeal(selectedDeal.id);
      setDeleteConfirmOpen(false);
      setSelectedDeal(null);
      await loadDeals();
    } catch (error: any) {
      setError(error.message || "Failed to delete deal");
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedDeal, loadDeals]);

  const handleDeactivate = useCallback(async () => {
    if (!selectedDeal) return;
    try {
      await adminApiClient.deactivateDeal(selectedDeal.id);
      setDeactivateConfirmOpen(false);
      setSelectedDeal(null);
      if (detailModalOpen) {
        setDetailModalOpen(false);
      }
      await loadDeals();
    } catch (error: any) {
      setError(error.message || "Failed to deactivate deal");
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedDeal, detailModalOpen, loadDeals]);

  const handleActivate = useCallback(async (dealId: string) => {
    try {
      await adminApiClient.activateDeal(dealId);
      await loadDeals();
      if (selectedDeal?.id === dealId && detailModalOpen) {
        setDetailModalOpen(false);
        setSelectedDeal(null);
      }
    } catch (error: any) {
      setError(error.message || "Failed to activate deal");
      setTimeout(() => setError(null), 5000);
    }
  }, [loadDeals, selectedDeal, detailModalOpen]);

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
          <h1>Available Deals</h1>
          <p>Manage approved deals that are visible to users</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="city-filter">City</label>
              <select
                id="city-filter"
                className="filter-select"
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">All Cities</option>
                <option value="dubai">Dubai</option>
                <option value="abudhabi">Abu Dhabi</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                className="filter-select"
                value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
                onChange={(e) => {
                  const value = e.target.value;
                  setActiveFilter(value === 'all' ? undefined : value === 'active');
                  setCurrentPage(0);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="table-section">
          <div className="table-header">
            <h3>Deals List</h3>
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
                <div>No approved deals found.</div>
                <p>Deals will appear here once they are approved</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property Name</th>
                    <th>Location</th>
                    <th>City</th>
                    <th>Bedrooms</th>
                    <th>Listed Price</th>
                    <th>Discount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <div className="deal-property-name">{deal.name || 'N/A'}</div>
                        <div className="deal-property-meta">{deal.size || 'N/A'}</div>
                      </td>
                      <td>{deal.location || 'N/A'}</td>
                      <td>{deal.city || 'N/A'}</td>
                      <td>{deal.bedrooms || 'N/A'}</td>
                      <td>{deal.listedPrice || 'N/A'}</td>
                      <td>
                        <span className="status-badge discount">
                          {deal.discount || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${deal.active ? 'active' : 'inactive'}`}>
                          {deal.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-small view-btn"
                            onClick={() => handleViewDetails(deal)}
                          >
                            View
                          </button>
                          <button
                            className="btn-small edit-btn"
                            onClick={() => handleEdit(deal)}
                          >
                            Edit
                          </button>
                          {deal.active ? (
                            <button
                              className="btn-small deactivate-btn"
                              onClick={() => {
                                setSelectedDeal(deal);
                                setDeactivateConfirmOpen(true);
                              }}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn-small activate-btn"
                              onClick={() => handleActivate(deal.id)}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            className="btn-small delete-btn"
                            onClick={() => {
                              setSelectedDeal(deal);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            Delete
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
              Page {currentPage + 1} of {totalPages} ({totalElements} total)
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
                      <span className={`status-badge ${selectedDeal.status?.toLowerCase() || ''}`}>
                        {selectedDeal.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="deal-detail-item">
                    <div className="deal-detail-label">Active</div>
                    <div className="deal-detail-value">
                      <span className={`status-badge ${selectedDeal.active ? 'active' : 'inactive'}`}>
                        {selectedDeal.active ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  {selectedDeal.approvedAt && (
                    <div className="deal-detail-item">
                      <div className="deal-detail-label">Approved At</div>
                      <div className="deal-detail-value">
                        {new Date(selectedDeal.approvedAt).toLocaleString()}
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
                {selectedDeal.active ? (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setDeactivateConfirmOpen(true);
                    }}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    className="btn-success"
                    onClick={() => handleActivate(selectedDeal.id)}
                  >
                    Activate
                  </button>
                )}
                <button
                  className="btn-danger"
                  onClick={() => {
                    setDeleteConfirmOpen(true);
                  }}
                >
                  Delete
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

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Confirm Deletion</h3>
                <button className="modal-close" onClick={() => setDeleteConfirmOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                  Are you sure you want to permanently delete <strong>{selectedDeal.name || 'this deal'}</strong>?
                </p>
                <p style={{ color: '#e74c3c', fontWeight: '600', fontSize: '0.9rem' }}>
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  Delete Deal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivate Confirmation Modal */}
        {deactivateConfirmOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setDeactivateConfirmOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Confirm Deactivation</h3>
                <button className="modal-close" onClick={() => setDeactivateConfirmOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                  Are you sure you want to deactivate <strong>{selectedDeal.name || 'this deal'}</strong>?
                </p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  The deal will be hidden from users but can be reactivated later.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setDeactivateConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="btn-secondary" onClick={handleDeactivate}>
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
