"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, User } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getAllUsers(currentPage, 20);
      // Handle paginated response
      if (response && Array.isArray(response.content)) {
        setUsers(response.content);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        // Fallback: if response is already an array (backwards compatibility)
        setUsers(response);
      } else {
        console.error("Unexpected response format:", response);
        setError("Unexpected response format from server");
      }
    } catch (error: any) {
      console.error("Error loading users:", error);
      setError(error.message || "Failed to load users");
      // If unauthorized, redirect to login
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router, currentPage]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadUsers();
  }, [router, loadUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">User List</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage all registered users</p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white/90">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.userTier === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400' :
                        user.userTier === 'PREMIUM' ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {user.userTier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-success-50 text-success-600 dark:bg-success-500/15' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setViewModalOpen(true);
                        }}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400"
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

      {/* View User Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        {selectedUser && (
          <div className="p-6 max-w-2xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white/90">User Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.isActive 
                        ? 'bg-success-50 text-success-600 dark:bg-success-500/15' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">First Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedUser.firstName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedUser.lastName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">User Tier</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.userTier === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400' :
                      selectedUser.userTier === 'PREMIUM' ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {selectedUser.userTier}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.emailVerified 
                        ? 'bg-success-50 text-success-600 dark:bg-success-500/15' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}>
                      {selectedUser.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </p>
                </div>
                {selectedUser.customerId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Customer ID</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedUser.customerId}</p>
                  </div>
                )}
                {selectedUser.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

