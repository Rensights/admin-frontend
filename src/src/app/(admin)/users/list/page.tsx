"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, User } from "@/lib/api";
import Link from "next/link";

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const downloadCsv = () => {
    const headers = [
      "ID",
      "Email",
      "First Name",
      "Last Name",
      "Phone",
      "Budget",
      "Portfolio",
      "Goals",
      "Registration Plan",
      "Tier",
      "Customer ID",
      "Status",
      "Email Verified",
      "Created At",
    ];
    const rows = users.map((user) => {
      return [
        user.id || "",
        user.email || "",
        user.firstName || "",
        user.lastName || "",
        user.phone || "",
        user.budget || "",
        user.portfolio || "",
        user.goals && user.goals.length > 0 ? user.goals.join(" | ") : "",
        user.registrationPlan || "",
        user.userTier || "",
        user.customerId || "",
        user.isActive ? "Active" : "Inactive",
        user.emailVerified ? "Verified" : "Not Verified",
        user.createdAt ? new Date(user.createdAt).toISOString() : "",
      ];
    });

    const escapeCell = (value: string) => {
      const safe = String(value ?? "");
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCsvWithHistory = async () => {
    const headers = [
      "ID",
      "Email",
      "First Name",
      "Last Name",
      "Phone",
      "Budget",
      "Portfolio",
      "Goals",
      "Registration Plan",
      "Tier",
      "Customer ID",
      "Status",
      "Email Verified",
      "Created At",
      "Subscription History",
    ];

    const escapeCell = (value: string) => {
      const safe = String(value ?? "");
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };

    const formatSubscription = (sub: any) => {
      const start = sub.startDate ? new Date(sub.startDate).toISOString() : "";
      const end = sub.endDate ? new Date(sub.endDate).toISOString() : "";
      const stripe = sub.stripeSubscriptionId || "";
      return `${sub.planType || ""} | ${sub.status || ""} | ${start} | ${end} | ${stripe}`.trim();
    };

    try {
      const histories = await Promise.all(
        users.map(async (user) => {
          try {
            const subs = await adminApiClient.getUserSubscriptions(user.id);
            return subs || [];
          } catch {
            return [];
          }
        })
      );

      const rows = users.map((user, index) => {
        const subs = histories[index] || [];
        return [
          user.id || "",
          user.email || "",
          user.firstName || "",
          user.lastName || "",
          user.phone || "",
          user.budget || "",
          user.portfolio || "",
          user.goals && user.goals.length > 0 ? user.goals.join(" | ") : "",
          user.registrationPlan || "",
          user.userTier || "",
          user.customerId || "",
          user.isActive ? "Active" : "Inactive",
          user.emailVerified ? "Verified" : "Not Verified",
          user.createdAt ? new Date(user.createdAt).toISOString() : "",
          subs.length > 0 ? subs.map(formatSubscription).join(" || ") : "",
        ];
      });

      const csv = [headers, ...rows]
        .map((row) => row.map(escapeCell).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users_with_subscriptions.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download CSV with subscription history:", error);
      setError("Failed to download CSV with subscription history");
    }
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getAllUsers(currentPage, pageSize);
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
  }, [router, currentPage, pageSize]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadUsers();
  }, [router, loadUsers]);

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(0);
  };

  const pageButtons = () => {
    const buttons: number[] = [];
    const total = totalPages || 1;
    const start = Math.max(0, currentPage - 2);
    const end = Math.min(total - 1, currentPage + 2);
    for (let i = start; i <= end; i += 1) {
      buttons.push(i);
    }
    return buttons;
  };

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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>
            {totalElements > 0
              ? `Showing ${currentPage * pageSize + 1}-${
                  currentPage * pageSize + users.length
                } of ${totalElements}`
              : "No users"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadCsv}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Download CSV
          </button>
          <button
            onClick={downloadCsvWithHistory}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-950 transition-colors"
          >
            Download CSV (With History)
          </button>
        </div>
      </div>

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
                      <Link 
                        href={`/users/list/${user.id}`}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage + 1} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 dark:border-gray-700"
          >
            Prev
          </button>
          {pageButtons().map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                page === currentPage
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {page + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
