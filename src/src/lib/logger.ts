const isProduction = process.env.NODE_ENV === "production";

export function logInfo(message: string, meta?: Record<string, unknown>) {
  if (!isProduction) return;
  if (meta) {
    console.info(message, meta);
  } else {
    console.info(message);
  }
}

export function logError(message: string, meta?: Record<string, unknown>) {
  if (!isProduction) return;
  if (meta) {
    console.error(message, meta);
  } else {
    console.error(message);
  }
}
