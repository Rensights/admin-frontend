"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, AnalysisRequest } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

export default function AnalysisRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AnalysisRequest | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiClient.getAllAnalysisRequests(currentPage, 20);
      setRequests(response.content);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error("Error loading analysis requests:", error);
      setError(error.message || "Failed to load analysis requests");
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
    loadRequests();
  }, [router, currentPage, loadRequests]);

  if (loading) {
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
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Property analysis requests from users</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white/90">{request.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.buildingName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'COMPLETED' ? 'bg-success-50 text-success-600 dark:bg-success-500/15' :
                      request.status === 'IN_PROGRESS' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => {
                        setSelectedRequest(request);
                        setViewModalOpen(true);
                      }}
                      className="text-brand-600 hover:text-brand-900 dark:text-brand-400"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Analysis Request Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        {selectedRequest && (
          <div className="p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white/90">Analysis Request Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedRequest.status === 'COMPLETED' ? 'bg-success-50 text-success-600 dark:bg-success-500/15' :
                      selectedRequest.status === 'IN_PROGRESS' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}>
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.city}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Area</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.area}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Building Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.buildingName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Property Type</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.propertyType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Bedrooms</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.bedrooms}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Asking Price</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.askingPrice}</p>
                </div>
                {selectedRequest.size && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Size</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.size}</p>
                  </div>
                )}
                {selectedRequest.buildingStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Building Status</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.buildingStatus}</p>
                  </div>
                )}
                {selectedRequest.developer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Developer</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90">{selectedRequest.developer}</p>
                  </div>
                )}
                {selectedRequest.listingUrl && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Listing URL</label>
                    <a href={selectedRequest.listingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-brand-600 hover:underline">
                      {selectedRequest.listingUrl}
                    </a>
                  </div>
                )}
                {selectedRequest.additionalNotes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Additional Notes</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90 whitespace-pre-wrap">{selectedRequest.additionalNotes}</p>
                  </div>
                )}
                {selectedRequest.filePaths && selectedRequest.filePaths.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Attachments</label>
                    <div className="mt-1 space-y-1">
                      {selectedRequest.filePaths.map((file, idx) => (
                        <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="block text-sm text-brand-600 hover:underline">
                          {file}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRequest.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white/90">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
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
