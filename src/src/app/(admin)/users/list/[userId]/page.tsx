"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminApiClient, ActivityTimelineItem, Subscription, User, UserLoginSummary } from "@/lib/api";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const [loginSummary, setLoginSummary] = useState<UserLoginSummary | null>(null);
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelineItem[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginHistoryError, setLoginHistoryError] = useState<string | null>(null);
  // Erasure: irreversible, so the admin retypes the account's email before the button arms.
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userTier: "FREE" as "FREE" | "PREMIUM" | "ENTERPRISE",
    isActive: true,
    emailVerified: false,
  });

  const loadUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    setSubscriptionsLoading(true);
    setSubscriptionsError(null);
    setLoginHistoryLoading(true);
    setLoginHistoryError(null);
    try {
      const [userData, userSubscriptions, loginSummaryData, timelineData] = await Promise.all([
        adminApiClient.getUserById(userId),
        adminApiClient.getUserSubscriptions(userId),
        adminApiClient.getUserLoginSummary(userId),
        adminApiClient.getUserActivityTimeline(userId, 0, 20),
      ]);
      setUser(userData);
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        userTier: userData.userTier || "FREE",
        isActive: userData.isActive,
        emailVerified: userData.emailVerified || false,
      });
      setSubscriptions(userSubscriptions || []);
      setLoginSummary(loginSummaryData);
      setActivityTimeline(timelineData.content || []);
    } catch (error: any) {
      console.error("Error loading user:", error);
      setError(error.message || "Failed to load user");
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        router.push('/login');
      }
      setSubscriptionsError(error.message || "Failed to load subscriptions");
      setLoginHistoryError(error.message || "Failed to load login history");
    } finally {
      setLoading(false);
      setLoginHistoryLoading(false);
      setSubscriptionsLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    loadUser();
  }, [router, loadUser]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApiClient.updateUser(user.id, formData);
      setUser(updated);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError(error.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteConfirmEmail("");
    setDeleteError(null);
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApiClient.deleteUser(user.id);
      router.push("/users/list");
    } catch (error: any) {
      // Most useful failure here is "billing could not be cancelled, nothing was deleted",
      // which the main backend passes back verbatim.
      setDeleteError(error.message || "Failed to delete this account");
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        userTier: user.userTier || "FREE",
        isActive: user.isActive,
        emailVerified: user.emailVerified || false,
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 mb-4">User not found</p>
        <Link href="/users/list" className="text-brand-600 hover:text-brand-900 dark:text-brand-400">
          Back to User List
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link 
          href="/users/list"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to User List
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">User Details</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View and manage user information</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="sm">
              Edit User
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Email</Label>
            {isEditing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.email}</p>
            )}
          </div>

          <div>
            <Label>Status</Label>
            {isEditing ? (
              <select
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <p className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive 
                    ? 'bg-success-50 text-success-600 dark:bg-success-500/15' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            )}
          </div>

          <div>
            <Label>First Name</Label>
            {isEditing ? (
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.firstName || 'N/A'}</p>
            )}
          </div>

          <div>
            <Label>Last Name</Label>
            {isEditing ? (
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.lastName || 'N/A'}</p>
            )}
          </div>

          <div>
            <Label>Phone</Label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.phone || 'N/A'}</p>
          </div>

          <div>
            <Label>Budget</Label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.budget || 'N/A'}</p>
          </div>

          <div>
            <Label>Portfolio</Label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.portfolio || 'N/A'}</p>
          </div>

          <div>
            <Label>Goals</Label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white/90">
              {user.goals && user.goals.length > 0 ? user.goals.join(", ") : 'N/A'}
            </p>
          </div>

          <div>
            <Label>Registration Plan</Label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.registrationPlan || 'N/A'}</p>
          </div>

          <div>
            <Label>User Tier</Label>
            {isEditing ? (
              <select
                value={formData.userTier}
                onChange={(e) => setFormData({ ...formData, userTier: e.target.value as "FREE" | "PREMIUM" | "ENTERPRISE" })}
                className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="FREE">FREE</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            ) : (
              <p className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.userTier === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400' :
                  user.userTier === 'PREMIUM' ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {user.userTier}
                </span>
              </p>
            )}
          </div>

          <div>
            <Label>Email Verified</Label>
            {isEditing ? (
              <select
                value={formData.emailVerified ? "verified" : "not_verified"}
                onChange={(e) => setFormData({ ...formData, emailVerified: e.target.value === "verified" })}
                className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="verified">Verified</option>
                <option value="not_verified">Not Verified</option>
              </select>
            ) : (
              <p className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.emailVerified 
                    ? 'bg-success-50 text-success-600 dark:bg-success-500/15' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                }`}>
                  {user.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </p>
            )}
          </div>

          {user.customerId && (
            <div>
              <Label>Customer ID</Label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{user.customerId}</p>
            </div>
          )}

          {user.createdAt && (
            <div>
              <Label>Created At</Label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white/90">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Subscription History</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              All subscriptions associated with this user.
            </p>
          </div>
        </div>

        {subscriptionsLoading ? (
          <div className="mt-4 text-sm text-gray-500">Loading subscriptions...</div>
        ) : subscriptionsError ? (
          <div className="mt-4 text-sm text-red-600">{subscriptionsError}</div>
        ) : subscriptions.length === 0 ? (
          <div className="mt-4 text-sm text-gray-500">No subscriptions found.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Start</th>
                  <th className="pb-3">End</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Stripe ID</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-white/90">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-3">{sub.planType}</td>
                    <td className="py-3">{sub.status}</td>
                    <td className="py-3">{sub.startDate ? new Date(sub.startDate).toLocaleString() : "-"}</td>
                    <td className="py-3">{sub.endDate ? new Date(sub.endDate).toLocaleString() : "-"}</td>
                    <td className="py-3">{sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "-"}</td>
                    <td className="py-3">{sub.stripeSubscriptionId || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Activity Timeline</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {loginSummary
                ? `${loginSummary.loginCount} total login${loginSummary.loginCount === 1 ? "" : "s"} · Last login: ${
                    loginSummary.lastLoginAt
                      ? new Date(loginSummary.lastLoginAt).toLocaleString()
                      : "Never"
                  }`
                : "Logins, page views, and key actions for this user."}
            </p>
          </div>
        </div>

        {loginHistoryLoading ? (
          <div className="mt-4 text-sm text-gray-500">Loading activity...</div>
        ) : loginHistoryError ? (
          <div className="mt-4 text-sm text-red-600">{loginHistoryError}</div>
        ) : activityTimeline.length === 0 ? (
          <div className="mt-4 text-sm text-gray-500">No activity recorded yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="pb-3">When</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Page / Details</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-white/90">
                {activityTimeline.map((item, index) => (
                  <tr key={`${item.occurredAt}-${index}`} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-3 whitespace-nowrap">{new Date(item.occurredAt).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.eventType === "LOGIN"
                          ? "bg-success-50 text-success-600 dark:bg-success-500/15"
                          : item.eventType === "PAGE_VIEW"
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          : "bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-400"
                      }`}>
                        {item.eventType}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {item.pagePath || item.metadata || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Showing the 20 most recent activity items.</p>
          </div>
        )}
      </div>

      {/* Danger zone — kept at the bottom and visually separate from the editable fields. */}
      <div className="rounded-2xl border border-error-200 bg-white dark:border-error-500/30 dark:bg-white/[0.03] p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Delete Account</h2>
        <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
          Permanently erase this account under the user&apos;s right to erasure. Any subscription is
          cancelled immediately with no refund, personal data and uploaded documents are deleted,
          and invoices are kept without personal details. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-lg text-white bg-error-500 hover:bg-error-600"
        >
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              Permanently delete this account?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This erases {user.email} and cannot be undone. If billing cannot be cancelled,
              nothing is deleted and you can retry.
            </p>

            <label className="mt-4 block text-sm text-gray-700 dark:text-gray-300">
              Type <span className="font-semibold">{user.email}</span> to confirm:
            </label>
            <input
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              disabled={deleting}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-error-500 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white/90"
            />

            {deleteError && (
              <div className="mt-3 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={
                  deleting ||
                  deleteConfirmEmail.trim().toLowerCase() !== (user.email || "").toLowerCase()
                }
                className="px-4 py-2 rounded-lg text-white bg-error-500 hover:bg-error-600 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





