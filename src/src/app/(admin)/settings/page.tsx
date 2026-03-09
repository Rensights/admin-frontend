"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyDealsEnabled, setWeeklyDealsEnabled] = useState(true);
  const [gaMeasurementId, setGaMeasurementId] = useState("");
  const [gaSaving, setGaSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [weekly, ga] = await Promise.all([
        adminApiClient.getWeeklyDealsEnabled(),
        adminApiClient.getGoogleAnalyticsMeasurementId(),
      ]);
      setWeeklyDealsEnabled(weekly.enabled);
      setGaMeasurementId(ga.measurementId || "");
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadSettings();
  }, [router, loadSettings]);

  const handleToggleWeeklyDeals = async () => {
    try {
      const next = !weeklyDealsEnabled;
      await adminApiClient.setWeeklyDealsEnabled(next);
      setWeeklyDealsEnabled(next);
    } catch (err: any) {
      setError(err.message || "Failed to update weekly deals setting");
    }
  };

  const handleSaveGaMeasurementId = async () => {
    setError(null);
    try {
      setGaSaving(true);
      const result = await adminApiClient.setGoogleAnalyticsMeasurementId(gaMeasurementId.trim());
      setGaMeasurementId(result.measurementId || "");
    } catch (err: any) {
      setError(err.message || "Failed to update Google Analytics ID");
    } finally {
      setGaSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Control feature visibility</p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-base font-semibold text-gray-800 dark:text-white/90">Weekly Deals</div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hide all weekly deals pages and API access when disabled.
            </p>
          </div>
          <button
            onClick={handleToggleWeeklyDeals}
            className="px-4 py-2 rounded-lg text-white transition-colors"
            style={{ background: weeklyDealsEnabled ? "#16a34a" : "#ef4444" }}
          >
            {weeklyDealsEnabled ? "Weekly Deals Enabled" : "Weekly Deals Disabled"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-base font-semibold text-gray-800 dark:text-white/90">Google Analytics</div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Set the Google Analytics measurement ID for the app frontend.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={gaMeasurementId}
              onChange={(e) => setGaMeasurementId(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="G-XXXXXXXXXX"
            />
            <button
              onClick={handleSaveGaMeasurementId}
              className="px-4 py-2 rounded-lg text-white transition-colors bg-brand-500 hover:bg-brand-600 disabled:opacity-60"
              disabled={gaSaving}
            >
              {gaSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
