"use client";

import { useEffect } from "react";
import GridShape from "@/components/common/GridShape";

export default function FullWidthError({
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
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 dark:bg-amber-500/10">
          <svg
            className="w-8 h-8 text-amber-500"
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

        <h1 className="mb-4 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
          Something went wrong
        </h1>

        <p className="mb-8 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
          An unexpected error occurred. Please try again, or contact support if
          the problem persists.
        </p>

        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Try again
        </button>
      </div>

      <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
        &copy; {new Date().getFullYear()} - Rensights
      </p>
    </div>
  );
}
