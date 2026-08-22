"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminApiClient, BuildingRow, BuildingImportResult } from "@/lib/api";

/**
 * The building catalogue that powers the type-ahead on the analysis request form.
 *
 * Maintained by CSV import rather than row-by-row entry: the list runs to thousands of towers
 * and arrives from external sources. Individual rows can still be deleted here for one-off
 * corrections.
 */
export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [result, setResult] = useState<BuildingImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.getBuildings(page, pageSize, search);
      setBuildings(data.content || []);
      setTotal(data.totalElements ?? 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const importResult = await adminApiClient.importBuildings(file, replaceExisting);
      setResult(importResult);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPage(0);
      await load();
    } catch (err: any) {
      setError(err?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (building: BuildingRow) => {
    try {
      await adminApiClient.deleteBuilding(building.id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to delete building");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Buildings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Suggestions shown to users typing a building name on the analysis request form. Users can
          still enter a building that is not on this list.
        </p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-error-600 bg-error-50 rounded-lg dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Import */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Import CSV</h2>
        <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
          A header row is expected. The name column may be called <code>name</code>,{" "}
          <code>building</code>, <code>building_name</code> or <code>project</code>;{" "}
          <code>area</code>, <code>city</code> and <code>developer</code> are optional. Comma and
          semicolon files both work. A file with just a list of names, and no header, also works.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={importing}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-white hover:file:bg-brand-600 dark:text-gray-300"
        />

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            disabled={importing}
          />
          Replace the whole catalogue (otherwise rows are merged by name and area)
        </label>

        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="mt-4 px-4 py-2 rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-60"
        >
          {importing ? "Importing..." : "Import"}
        </button>

        {result && (
          <div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800">
            <div className="text-gray-800 dark:text-white/90">
              {result.created} added · {result.updated} updated · {result.skipped} skipped
            </div>
            {result.problems.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-error-600 dark:text-error-400">
                {result.problems.map((problem, index) => (
                  <li key={index}>{problem}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Catalogue */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Catalogue ({total})
          </h2>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            placeholder="Search name or area"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white/90"
          />
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : buildings.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No buildings yet. Import a CSV to get started.
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Area</th>
                  <th className="py-2">City</th>
                  <th className="py-2">Developer</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => (
                  <tr key={building.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-gray-800 dark:text-white/90">{building.name}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{building.area || "—"}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{building.city || "—"}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {building.developer || "—"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(building)}
                        className="text-sm text-error-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 dark:border-gray-800 dark:text-gray-300"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                  disabled={page + 1 >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 dark:border-gray-800 dark:text-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
