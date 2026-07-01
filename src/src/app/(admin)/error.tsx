"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-full bg-amber-50 dark:bg-amber-500/10">
        <svg
          className="w-7 h-7 text-amber-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white/90">
        Something went wrong
      </h2>

      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        An unexpected error occurred while loading this page. Please try again,
        or contact support if the problem persists.
      </p>

      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
      >
        Try again
      </button>
    </div>
  );
}
