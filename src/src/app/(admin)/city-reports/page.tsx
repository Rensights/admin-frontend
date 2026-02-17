"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminApiClient,
  ReportDocument,
  ReportDocumentRequest,
  ReportSection,
  ReportSectionRequest,
} from "@/lib/api";

const emptySection: ReportSectionRequest = {
  sectionKey: "",
  title: "",
  navTitle: "",
  description: "",
  accessTier: "FREE",
  displayOrder: 1,
  languageCode: "en",
  isActive: true,
};

const emptyDocument: ReportDocumentRequest = {
  title: "",
  description: "",
  displayOrder: 1,
  languageCode: "en",
  isActive: true,
};

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function CityReportsAdminPage() {
  const router = useRouter();
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState<ReportSectionRequest>(emptySection);

  const [uploadSectionId, setUploadSectionId] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [documentForm, setDocumentForm] = useState<ReportDocumentRequest>(emptyDocument);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const loadLanguages = useCallback(async () => {
    try {
      const available = await adminApiClient.getAvailableLanguages();
      if (available.length > 0) {
        setLanguages(available);
        if (!available.includes(language)) {
          setLanguage(available[0]);
        }
      }
    } catch {
      setLanguages(["en"]);
    }
  }, [language]);

  const loadSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminApiClient.getReportSections(language);
      setSections(list);
    } catch (err: any) {
      setError(err.message || "Failed to load report sections");
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [language, router]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadLanguages();
  }, [router, loadLanguages]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const resetSectionForm = () => {
    setSectionForm({ ...emptySection, languageCode: language });
    setEditingSectionId(null);
  };

  const resetDocumentForm = () => {
    setDocumentForm({ ...emptyDocument, languageCode: language });
    setDocumentFile(null);
    setEditingDocumentId(null);
    setUploadSectionId(null);
  };

  const handleSectionSave = async () => {
    setError(null);
    try {
      if (!sectionForm.title || !sectionForm.navTitle) {
        setError("Title and nav title are required");
        return;
      }
      if (!editingSectionId) {
        setError("Select a section to edit");
        return;
      }
      await adminApiClient.updateReportSection(editingSectionId, sectionForm);
      await loadSections();
      resetSectionForm();
    } catch (err: any) {
      setError(err.message || "Failed to save section");
    }
  };

  const handleEditSection = (section: ReportSection) => {
    setEditingSectionId(section.id);
    setSectionForm({
      sectionKey: section.sectionKey,
      title: section.title,
      navTitle: section.navTitle,
      description: section.description || "",
      accessTier: section.accessTier,
      displayOrder: section.displayOrder,
      languageCode: section.languageCode || language,
      isActive: section.isActive ?? true,
    });
  };

  const handleOpenUpload = (sectionId: string) => {
    setUploadSectionId(sectionId);
    setEditingDocumentId(null);
    setDocumentForm({ ...emptyDocument, languageCode: "en" });
    setDocumentFile(null);
  };

  const handleEditDocument = (sectionId: string, doc: ReportDocument) => {
    setUploadSectionId(sectionId);
    setEditingDocumentId(doc.id);
    setDocumentForm({
      title: doc.title,
      description: doc.description || "",
      displayOrder: doc.displayOrder,
      languageCode: "en",
      isActive: doc.isActive ?? true,
    });
    setDocumentFile(null);
  };

  const handleSaveDocument = async (sectionId: string) => {
    setError(null);
    try {
      if (!documentForm.title) {
        setError("Document title is required");
        return;
      }
      if (editingDocumentId) {
        await adminApiClient.updateReportDocument(editingDocumentId, documentForm);
      } else {
        if (!documentFile) {
          setError("Please select a PDF file");
          return;
        }
        await adminApiClient.uploadReportDocument(sectionId, documentForm, documentFile);
      }
      await loadSections();
      resetDocumentForm();
    } catch (err: any) {
      setError(err.message || "Failed to save document");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    setError(null);
    try {
      await adminApiClient.deleteReportDocument(docId);
      await loadSections();
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [sections]);

  const mainBackendUrl = adminApiClient.getMainBackendUrl();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading city reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">City Reports</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage city analysis sections and PDF documents
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {editingSectionId && (
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Edit Section
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section Key
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={sectionForm.sectionKey}
                disabled
                onChange={(e) => setSectionForm({ ...sectionForm, sectionKey: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Navigation Title
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={sectionForm.navTitle}
                onChange={(e) => setSectionForm({ ...sectionForm, navTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Tier
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={sectionForm.accessTier}
                disabled
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    accessTier: e.target.value as "FREE" | "PREMIUM" | "ENTERPRISE",
                  })
                }
              >
                <option value="FREE">FREE</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Order
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={sectionForm.displayOrder}
                disabled
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, displayOrder: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language Code
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={sectionForm.languageCode}
                onChange={(e) => setSectionForm({ ...sectionForm, languageCode: e.target.value })}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={sectionForm.isActive ?? true}
                onChange={(e) => setSectionForm({ ...sectionForm, isActive: e.target.checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                value={sectionForm.description || ""}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleSectionSave} className="px-4 py-2 bg-brand-500 text-white rounded-lg">
              Update Section
            </button>
            <button onClick={resetSectionForm} className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {sortedSections.map((section) => {
          const docs = section.documents || [];
          const maxDocs = section.displayOrder === 5 ? 8 : 1;
          const atLimit = docs.length >= maxDocs;
          return (
            <div key={section.id} className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{section.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {section.navTitle} • {section.sectionKey} • {section.accessTier}
                  </p>
                  {section.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{section.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Order: {section.displayOrder} • Language: {section.languageCode?.toUpperCase()} •{" "}
                    {section.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
                    onClick={() => handleEditSection(section)}
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Documents</h4>
                  <button
                    className="px-3 py-2 text-sm rounded-lg bg-brand-500 text-white disabled:opacity-50"
                    onClick={() => handleOpenUpload(section.id)}
                    disabled={atLimit}
                  >
                    Upload PDF
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Max files: {maxDocs} {atLimit ? "(limit reached)" : ""}
                </p>

                {uploadSectionId === section.id && (
                  <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {editingDocumentId ? "Edit Document" : "Upload New Document"}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={documentForm.title}
                          onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={documentForm.displayOrder}
                          onChange={(e) =>
                            setDocumentForm({ ...documentForm, displayOrder: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Language
                        </label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value="EN"
                          disabled
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input
                          type="checkbox"
                          checked={documentForm.isActive ?? true}
                          onChange={(e) => setDocumentForm({ ...documentForm, isActive: e.target.checked })}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={2}
                          value={documentForm.description || ""}
                          onChange={(e) =>
                            setDocumentForm({ ...documentForm, description: e.target.value })
                          }
                        />
                      </div>
                      {!editingDocumentId && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            PDF File
                          </label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-700 dark:text-gray-300"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="px-3 py-2 text-sm rounded-lg bg-brand-500 text-white"
                        onClick={() => handleSaveDocument(section.id)}
                      >
                        {editingDocumentId ? "Update Document" : "Upload Document"}
                      </button>
                      <button
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
                        onClick={resetDocumentForm}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {docs.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No documents uploaded yet.
                    </p>
                  )}
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-start justify-between gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{doc.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Order: {doc.displayOrder} • {doc.languageCode?.toUpperCase()} •{" "}
                          {doc.isActive ? "Active" : "Inactive"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          File: {doc.originalFilename || doc.filePath || "-"} • {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`${mainBackendUrl}/api/reports/documents/${doc.id}/file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
                        >
                          Preview
                        </a>
                        <button
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
                          onClick={() => handleEditDocument(section.id, doc)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-2 text-sm rounded-lg border border-red-500 text-red-600"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
