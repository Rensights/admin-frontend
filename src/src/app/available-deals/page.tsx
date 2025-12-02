"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApiClient, Deal, PaginatedResponse } from "@/lib/api";
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

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getApprovedDeals(currentPage, 20, cityFilter || undefined, activeFilter);
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
      alert(error.message || "Failed to update deal");
    }
  }, [selectedDeal, editingDeal, loadDeals]);

  const handleDelete = useCallback(async (dealId: string) => {
    if (!confirm("Are you sure you want to permanently delete this deal? This action cannot be undone.")) return;
    try {
      await adminApiClient.deleteDeal(dealId);
      await loadDeals();
      if (selectedDeal?.id === dealId) {
        setDetailModalOpen(false);
        setSelectedDeal(null);
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete deal");
    }
  }, [loadDeals, selectedDeal]);

  const handleDeactivate = useCallback(async (dealId: string) => {
    if (!confirm("Are you sure you want to deactivate this deal? It will be hidden from users.")) return;
    try {
      await adminApiClient.deactivateDeal(dealId);
      await loadDeals();
      if (selectedDeal?.id === dealId) {
        setDetailModalOpen(false);
        setSelectedDeal(null);
      }
    } catch (error: any) {
      alert(error.message || "Failed to deactivate deal");
    }
  }, [loadDeals, selectedDeal]);

  const handleActivate = useCallback(async (dealId: string) => {
    try {
      await adminApiClient.activateDeal(dealId);
      await loadDeals();
      if (selectedDeal?.id === dealId) {
        setDetailModalOpen(false);
        setSelectedDeal(null);
      }
    } catch (error: any) {
      alert(error.message || "Failed to activate deal");
    }
  }, [loadDeals, selectedDeal]);

  const handleLogout = () => {
    adminApiClient.logout();
  };

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

        {/* Filters */}
        <div className="filters-section" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City:</label>
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(0);
                }}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="">All Cities</option>
                <option value="dubai">Dubai</option>
                <option value="abudhabi">Abu Dhabi</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status:</label>
              <select
                value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
                onChange={(e) => {
                  const value = e.target.value;
                  setActiveFilter(value === 'all' ? undefined : value === 'active');
                  setCurrentPage(0);
                }}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading deals...</p>
            </div>
          ) : deals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No approved deals found.</p>
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
                      <div style={{ fontWeight: '600' }}>{deal.name || 'N/A'}</div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>{deal.size || 'N/A'}</div>
                    </td>
                    <td>{deal.location || 'N/A'}</td>
                    <td>{deal.city || 'N/A'}</td>
                    <td>{deal.bedrooms || 'N/A'}</td>
                    <td>{deal.listedPrice || 'N/A'}</td>
                    <td>
                      <span className="status-badge" style={{ background: '#28a745', color: 'white' }}>
                        {deal.discount || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ 
                        background: deal.active ? '#28a745' : '#6c757d', 
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85em'
                      }}>
                        {deal.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="btn-small"
                          onClick={() => handleViewDetails(deal)}
                          style={{ background: '#17a2b8', color: 'white' }}
                        >
                          View
                        </button>
                        <button
                          className="btn-small"
                          onClick={() => handleEdit(deal)}
                          style={{ background: '#ffc107', color: '#333' }}
                        >
                          Edit
                        </button>
                        {deal.active ? (
                          <button
                            className="btn-small"
                            onClick={() => handleDeactivate(deal.id)}
                            style={{ background: '#6c757d', color: 'white' }}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="btn-small btn-success"
                            onClick={() => handleActivate(deal.id)}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          className="btn-small"
                          onClick={() => handleDelete(deal.id)}
                          style={{ background: '#dc3545', color: 'white' }}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <span>
              Page {currentPage + 1} of {totalPages} ({totalElements} total)
            </span>
            <button
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
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Deal Details</h2>
                <button onClick={() => setDetailModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <strong>Name:</strong> {selectedDeal.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedDeal.location || 'N/A'}
                  </div>
                  <div>
                    <strong>City:</strong> {selectedDeal.city || 'N/A'}
                  </div>
                  <div>
                    <strong>Area:</strong> {selectedDeal.area || 'N/A'}
                  </div>
                  <div>
                    <strong>Bedrooms:</strong> {selectedDeal.bedrooms || 'N/A'}
                  </div>
                  <div>
                    <strong>Size:</strong> {selectedDeal.size || 'N/A'}
                  </div>
                  <div>
                    <strong>Listed Price:</strong> {selectedDeal.listedPrice || 'N/A'}
                  </div>
                  <div>
                    <strong>Price Value:</strong> {selectedDeal.priceValue ? `AED ${selectedDeal.priceValue.toLocaleString()}` : 'N/A'}
                  </div>
                  <div>
                    <strong>Estimate Range:</strong> {selectedDeal.estimateRange || 'N/A'}
                  </div>
                  <div>
                    <strong>Discount:</strong> {selectedDeal.discount || 'N/A'}
                  </div>
                  <div>
                    <strong>Rental Yield:</strong> {selectedDeal.rentalYield || 'N/A'}
                  </div>
                  <div>
                    <strong>Building Status:</strong> {selectedDeal.buildingStatus || 'N/A'}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedDeal.status || 'N/A'}
                  </div>
                  <div>
                    <strong>Active:</strong> {selectedDeal.active ? 'Yes' : 'No'}
                  </div>
                  {selectedDeal.approvedAt && (
                    <div>
                      <strong>Approved At:</strong> {new Date(selectedDeal.approvedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => { setDetailModalOpen(false); handleEdit(selectedDeal); }} style={{ background: '#ffc107', color: '#333' }}>
                  Edit
                </button>
                {selectedDeal.active ? (
                  <button onClick={() => { handleDeactivate(selectedDeal.id); }} style={{ background: '#6c757d', color: 'white' }}>
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => { handleActivate(selectedDeal.id); }} className="btn-success">
                    Activate
                  </button>
                )}
                <button onClick={() => { handleDelete(selectedDeal.id); }} style={{ background: '#dc3545', color: 'white' }}>
                  Delete
                </button>
                <button onClick={() => setDetailModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && selectedDeal && (
          <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>Edit Deal</h2>
                <button onClick={() => setEditModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label>Name:</label>
                    <input
                      type="text"
                      value={editingDeal.name || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Location:</label>
                    <input
                      type="text"
                      value={editingDeal.location || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>City:</label>
                    <input
                      type="text"
                      value={editingDeal.city || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Area:</label>
                    <input
                      type="text"
                      value={editingDeal.area || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, area: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Bedrooms:</label>
                    <input
                      type="text"
                      value={editingDeal.bedrooms || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, bedrooms: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Size:</label>
                    <input
                      type="text"
                      value={editingDeal.size || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, size: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Listed Price:</label>
                    <input
                      type="text"
                      value={editingDeal.listedPrice || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, listedPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Discount:</label>
                    <input
                      type="text"
                      value={editingDeal.discount || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, discount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Rental Yield:</label>
                    <input
                      type="text"
                      value={editingDeal.rentalYield || ''}
                      onChange={(e) => setEditingDeal({ ...editingDeal, rentalYield: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={handleSaveEdit} className="btn-success">Save</button>
                <button onClick={() => setEditModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

