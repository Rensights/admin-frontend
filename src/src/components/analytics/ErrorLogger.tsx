"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

export function ErrorLogger() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError("admin.frontend.error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logError("admin.frontend.unhandledrejection", {
        reason: typeof reason === "string" ? reason : undefined,
        name: reason?.name,
        message: reason?.message,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
