"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminApiClient, User } from "@/lib/api";
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
    try {
      const userData = await adminApiClient.getUserById(userId);
      setUser(userData);
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        userTier: userData.userTier || "FREE",
        isActive: userData.isActive,
        emailVerified: userData.emailVerified || false,
      });
    } catch (error: any) {
      console.error("Error loading user:", error);
      setError(error.message || "Failed to load user");
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
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
    </div>
  );
}







