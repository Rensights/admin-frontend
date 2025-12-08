"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { adminApiClient, Deal } from "@/lib/api";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.dealId as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedDeal, setEditedDeal] = useState<Partial<Deal>>({});

  const loadDeal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dealData = await adminApiClient.getDealById(dealId);
      setDeal(dealData);
      setEditedDeal(dealData);
    } catch (error: any) {
      console.error("Error loading deal:", error);
      setError(error.message || "Failed to load deal");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (dealId) {
      loadDeal();
    }
  }, [router, dealId, loadDeal]);

  const handleSave = async () => {
    if (!deal) return;
    
    setSaving(true);
    setError(null);
    try {
      const updatedDeal = await adminApiClient.updateDeal(deal.id, editedDeal);
      setDeal(updatedDeal);
      setEditing(false);
      setEditedDeal(updatedDeal);
    } catch (error: any) {
      console.error("Error updating deal:", error);
      setError(error.message || "Failed to update deal");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!deal) return;
    if (!confirm("Are you sure you want to approve this deal?")) return;

    setSaving(true);
    setError(null);
    try {
      await adminApiClient.approveDeal(deal.id);
      await loadDeal();
      alert("Deal approved successfully!");
    } catch (error: any) {
      console.error("Error approving deal:", error);
      setError(error.message || "Failed to approve deal");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!deal) return;
    if (!confirm("Are you sure you want to reject/archive this deal?")) return;

    setSaving(true);
    setError(null);
    try {
      await adminApiClient.rejectDeal(deal.id);
      await loadDeal();
      alert("Deal rejected/archived successfully!");
    } catch (error: any) {
      console.error("Error rejecting deal:", error);
      setError(error.message || "Failed to reject deal");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (deal) {
      setEditedDeal(deal);
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Deal not found</p>
          <Link href="/deals" className="mt-4 text-brand-600 hover:text-brand-900">
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  const displayDeal = editing ? editedDeal : deal;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/deals" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2 inline-block">
            ← Back to Deals
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {editing ? "Edit Deal" : "Deal Details"}
          </h1>
        </div>
        <div className="flex gap-3">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              {deal.status === "PENDING" && (
                <Button onClick={handleApprove} disabled={saving}>
                  {saving ? "Approving..." : "Approve"}
                </Button>
              )}
              {deal.status === "APPROVED" && (
                <Button variant="outline" onClick={handleReject} disabled={saving} className="border-red-300 text-red-600 hover:bg-red-50">
                  {saving ? "Archiving..." : "Archive"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              {editing ? (
                <InputField
                  value={displayDeal.name || ""}
                  onChange={(e) => setEditedDeal({ ...editedDeal, name: e.target.value })}
                  placeholder="Deal name"
                />
              ) : (
                <p className="text-gray-900 dark:text-white/90">{deal.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              {editing ? (
                <InputField
                  value={displayDeal.location || ""}
                  onChange={(e) => setEditedDeal({ ...editedDeal, location: e.target.value })}
                  placeholder="Location"
                />
              ) : (
                <p className="text-gray-900 dark:text-white/90">{deal.location}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                {editing ? (
                  <InputField
                    value={displayDeal.city || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, city: e.target.value })}
                    placeholder="City"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white/90">{deal.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area</label>
                {editing ? (
                  <InputField
                    value={displayDeal.area || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, area: e.target.value })}
                    placeholder="Area"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white/90">{deal.area}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bedrooms</label>
                {editing ? (
                  <InputField
                    value={displayDeal.bedrooms || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, bedrooms: e.target.value })}
                    placeholder="Bedrooms"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white/90">{deal.bedrooms}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
                {editing ? (
                  <InputField
                    value={displayDeal.size || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, size: e.target.value })}
                    placeholder="Size"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white/90">{deal.size}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Pricing Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Listed Price</label>
              {editing ? (
                <InputField
                  value={displayDeal.listedPrice || ""}
                  onChange={(e) => setEditedDeal({ ...editedDeal, listedPrice: e.target.value })}
                  placeholder="Listed price"
                />
              ) : (
                <p className="text-gray-900 dark:text-white/90 font-semibold">{deal.listedPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price Value</label>
              {editing ? (
                <InputField
                  type="number"
                  value={displayDeal.priceValue?.toString() || ""}
                  onChange={(e) => setEditedDeal({ ...editedDeal, priceValue: parseFloat(e.target.value) || 0 })}
                  placeholder="Price value"
                />
              ) : (
                <p className="text-gray-900 dark:text-white/90">{deal.priceValue?.toLocaleString() || "N/A"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimate Range</label>
              {editing ? (
                <InputField
                  value={displayDeal.estimateRange || ""}
                  onChange={(e) => setEditedDeal({ ...editedDeal, estimateRange: e.target.value })}
                  placeholder="Estimate range"
                />
              ) : (
                <p className="text-gray-900 dark:text-white/90">{deal.estimateRange || "N/A"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount</label>
                {editing ? (
                  <InputField
                    value={displayDeal.discount || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, discount: e.target.value })}
                    placeholder="Discount"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white/90">{deal.discount || "N/A"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rental Yield</label>
                {editing ? (
                  <InputField
                    value={displayDeal.rentalYield || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, rentalYield: e.target.value })}
                    placeholder="Rental yield"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white/90">{deal.rentalYield || "N/A"}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Building Status</label>
              {editing ? (
                <select
                  value={displayDeal.buildingStatus || ""}
                  onChange={(e) => setEditedDeal({ ...editedDeal, buildingStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="READY">Ready</option>
                  <option value="OFF_PLAN">Off Plan</option>
                </select>
              ) : (
                <p className="text-gray-900 dark:text-white/90">{deal.buildingStatus}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Status Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                deal.status === "APPROVED" 
                  ? "bg-success-50 text-success-600 dark:bg-success-500/15"
                  : deal.status === "PENDING"
                  ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15"
                  : "bg-error-50 text-error-600 dark:bg-error-500/15"
              }`}>
                {deal.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Active</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                deal.active 
                  ? "bg-success-50 text-success-600 dark:bg-success-500/15"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800"
              }`}>
                {deal.active ? "Active" : "Inactive"}
              </span>
            </div>

            {deal.createdAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created At</label>
                <p className="text-gray-900 dark:text-white/90">{new Date(deal.createdAt).toLocaleString()}</p>
              </div>
            )}

            {deal.approvedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Approved At</label>
                <p className="text-gray-900 dark:text-white/90">{new Date(deal.approvedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

