// Minimal client-side CSV export for datasets already loaded in the browser.
// (The large per-user export is streamed from the backend instead.)

function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from a header row and object rows, picking `columns` in order.
 */
export function toCsv<T>(
  columns: { key: keyof T; label: string }[],
  rows: T[]
): string {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCell((row as Record<string, unknown>)[c.key as string]))
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

/** Trigger a browser download of `content` as `filename`. */
export function downloadTextFile(filename: string, content: string, mime = "text/csv"): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Convenience: build CSV from columns+rows and download it. */
export function downloadCsv<T>(
  filename: string,
  columns: { key: keyof T; label: string }[],
  rows: T[]
): void {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(`${filename}-${stamp}.csv`, toCsv(columns, rows));
}
