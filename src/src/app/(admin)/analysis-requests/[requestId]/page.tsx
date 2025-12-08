"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminApiClient, AnalysisRequest } from "@/lib/api";
import Link from "next/link";

export default function AnalysisRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params?.requestId as string;
  
  const [request, setRequest] = useState<AnalysisRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    if (!requestId) return;
    
    setLoading(true);
    setError(null);
    try {
      const requestData = await adminApiClient.getAnalysisRequestById(requestId);
      setRequest(requestData);
    } catch (error: any) {
      console.error("Error loading analysis request:", error);
      setError(error.message || "Failed to load analysis request");
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadRequest();
  }, [router, loadRequest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading analysis request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 mb-4">Analysis request not found</p>
        <Link href="/analysis-requests" className="text-brand-600 hover:text-brand-900 dark:text-brand-400">
          Back to Analysis Requests
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link 
          href="/analysis-requests"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analysis Requests
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Analysis Request Details</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View complete analysis request information</p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <p className="text-sm text-gray-900 dark:text-white/90">{request.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                request.status === 'COMPLETED' ? 'bg-success-50 text-success-600 dark:bg-success-500/15' :
                request.status === 'IN_PROGRESS' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15' :
                'bg-gray-100 text-gray-600 dark:bg-gray-800'
              }`}>
                {request.status}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">City</label>
            <p className="text-sm text-gray-900 dark:text-white/90">{request.city}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Area</label>
            <p className="text-sm text-gray-900 dark:text-white/90">{request.area}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Building Name</label>
            <p className="text-sm text-gray-900 dark:text-white/90">{request.buildingName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Property Type</label>
            <p className="text-sm text-gray-900 dark:text-white/90">{request.propertyType}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bedrooms</label>
            <p className="text-sm text-gray-900 dark:text-white/90">{request.bedrooms}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Asking Price</label>
            <p className="text-sm text-gray-900 dark:text-white/90">{request.askingPrice}</p>
          </div>

          {request.size && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Size</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.size}</p>
            </div>
          )}

          {request.plotSize && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Plot Size</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.plotSize}</p>
            </div>
          )}

          {request.floor && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Floor</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.floor}</p>
            </div>
          )}

          {request.totalFloors && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Floors</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.totalFloors}</p>
            </div>
          )}

          {request.buildingStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Building Status</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.buildingStatus}</p>
            </div>
          )}

          {request.condition && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Condition</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.condition}</p>
            </div>
          )}

          {request.serviceCharge && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Service Charge</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.serviceCharge}</p>
            </div>
          )}

          {request.developer && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Developer</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.developer}</p>
            </div>
          )}

          {request.handoverDate && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Handover Date</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.handoverDate}</p>
            </div>
          )}

          {request.paymentPlan && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Payment Plan</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.paymentPlan}</p>
            </div>
          )}

          {request.view && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">View</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.view}</p>
            </div>
          )}

          {request.furnishing && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Furnishing</label>
              <p className="text-sm text-gray-900 dark:text-white/90">{request.furnishing}</p>
            </div>
          )}

          {request.listingUrl && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Listing URL</label>
              <a 
                href={request.listingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-brand-600 hover:underline break-all"
              >
                {request.listingUrl}
              </a>
            </div>
          )}

          {request.latitude && request.longitude && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</label>
              <p className="text-sm text-gray-900 dark:text-white/90">
                Latitude: {request.latitude}, Longitude: {request.longitude}
              </p>
              <a
                href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-600 hover:underline mt-1 inline-block"
              >
                View on Google Maps
              </a>
            </div>
          )}

          {request.features && request.features.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Features</label>
              <div className="flex flex-wrap gap-2">
                {request.features.map((feature, idx) => (
                  <span key={idx} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-800 dark:text-gray-300">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {request.additionalNotes && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Additional Notes</label>
              <p className="text-sm text-gray-900 dark:text-white/90 whitespace-pre-wrap">{request.additionalNotes}</p>
            </div>
          )}

          {request.filePaths && request.filePaths.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Attachments</label>
              <div className="space-y-2">
                {request.filePaths.map((file, idx) => (
                  <div key={idx}>
                    <a 
                      href={file} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-brand-600 hover:underline break-all"
                    >
                      {file}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request.createdAt && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</label>
              <p className="text-sm text-gray-900 dark:text-white/90">
                {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>
          )}

          {request.updatedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Updated At</label>
              <p className="text-sm text-gray-900 dark:text-white/90">
                {new Date(request.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


