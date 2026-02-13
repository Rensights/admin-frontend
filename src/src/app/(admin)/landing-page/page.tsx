"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { adminApiClient, LandingPageContent, LandingPageContentRequest, LandingPageSection, Language } from "@/lib/api";

const SECTIONS = [
  { value: "hero", label: "Hero Section" },
  { value: "why-invest", label: "Why Invest in Dubai" },
  { value: "solutions", label: "Solutions" },
  { value: "how-it-works", label: "How It Works" },
  { value: "pricing", label: "Pricing" },
  { value: "footer", label: "Footer" },
];

const CONTENT_TYPES = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image URL" },
  { value: "video", label: "YouTube Video URL" },
  { value: "json", label: "JSON (for arrays/objects)" },
];

export default function LandingPageManagement() {
  const searchParams = useSearchParams();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("hero");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [content, setContent] = useState<LandingPageContent[]>([]);
  const [sectionData, setSectionData] = useState<LandingPageSection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<LandingPageContent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [solutionVideos, setSolutionVideos] = useState<string[]>(["", "", "", ""]);
  const [formData, setFormData] = useState<LandingPageContentRequest>({
    section: "hero",
    languageCode: "en",
    fieldKey: "",
    contentType: "text",
    contentValue: "",
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    const sectionFromQuery = searchParams?.get("section");
    if (sectionFromQuery) {
      setSelectedSection(sectionFromQuery);
    }
    loadLanguages();
  }, [searchParams]);

  useEffect(() => {
    if (selectedSection && selectedLanguage) {
      loadSectionContent();
    }
  }, [selectedSection, selectedLanguage]);

  const loadLanguages = async () => {
    try {
      const langs = await adminApiClient.getAllLanguages();
      setLanguages(langs);
      if (langs.length > 0 && !selectedLanguage) {
        const defaultLang = langs.find(l => l.isDefault) || langs[0];
        setSelectedLanguage(defaultLang.code);
      }
    } catch (error: any) {
      setError("Failed to load languages");
    }
  };

  const loadSectionContent = async () => {
    setLoading(true);
    try {
      const [contentList, section] = await Promise.all([
        adminApiClient.getLandingPageContentBySection(selectedSection),
        adminApiClient.getLandingPageSection(selectedSection, selectedLanguage),
      ]);
      const filtered = contentList.filter(c => c.languageCode === selectedLanguage);
      setContent(filtered);
      if (selectedSection === "solutions") {
        const byKey = new Map(filtered.map(item => [item.fieldKey, item]));
        setSolutionVideos([
          byKey.get("video1")?.contentValue || "",
          byKey.get("video2")?.contentValue || "",
          byKey.get("video3")?.contentValue || "",
          byKey.get("video4")?.contentValue || "",
        ]);
      }
      setSectionData(section);
    } catch (error: any) {
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (editingItem) {
        await adminApiClient.updateLandingPageContent(editingItem.id, formData);
        setSuccess("Content updated successfully");
      } else {
        await adminApiClient.createOrUpdateLandingPageContent(formData);
        setSuccess("Content created successfully");
      }
      setEditingItem(null);
      setShowAddForm(false);
      resetForm();
      loadSectionContent();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to save content");
    }
  };

  const handleEdit = (item: LandingPageContent) => {
    setEditingItem(item);
    setFormData({
      section: item.section,
      languageCode: item.languageCode,
      fieldKey: item.fieldKey,
      contentType: item.contentType as any,
      contentValue: item.contentValue,
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    setError(null);
    setSuccess(null);
    try {
      await adminApiClient.deleteLandingPageContent(id);
      setSuccess("Content deleted successfully");
      loadSectionContent();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError("Failed to delete content");
    }
  };

  const resetForm = () => {
    setFormData({
      section: selectedSection,
      languageCode: selectedLanguage,
      fieldKey: "",
      contentType: "text",
      contentValue: "",
      displayOrder: 0,
      isActive: true,
    });
  };

  const handleAddNew = () => {
    resetForm();
    setEditingItem(null);
    setShowAddForm(true);
  };

  const handleSaveSolutionVideos = async () => {
    setError(null);
    setSuccess(null);
    try {
      const existingByKey = new Map(content.map(item => [item.fieldKey, item]));
      const updates = solutionVideos.map((value, idx) => {
        const fieldKey = `video${idx + 1}`;
        const trimmed = value.trim();
        const existing = existingByKey.get(fieldKey);
        if (!trimmed) {
          if (existing) {
            return adminApiClient.deleteLandingPageContent(existing.id);
          }
          return Promise.resolve();
        }
        return adminApiClient.createOrUpdateLandingPageContent({
          section: selectedSection,
          languageCode: selectedLanguage,
          fieldKey,
          contentType: "video",
          contentValue: trimmed,
          displayOrder: idx,
          isActive: true,
        });
      });
      await Promise.all(updates);
      setSuccess("Solutions videos updated successfully");
      loadSectionContent();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to update solutions videos");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Landing Page Content Management</h1>
        <p className="text-gray-600">Manage all landing page content including text, images, and videos</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
          <button onClick={() => setSuccess(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName || lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? "Edit Content" : "Add New Content"}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Field Key</label>
                <input
                  type="text"
                  value={formData.fieldKey}
                  onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., title, subtitle, imageUrl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content Value</label>
              {formData.contentType === "json" ? (
                <textarea
                  value={formData.contentValue}
                  onChange={(e) => setFormData({ ...formData, contentValue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  rows={8}
                  placeholder='{"key": "value"}'
                />
              ) : (
                <input
                  type="text"
                  value={formData.contentValue}
                  onChange={(e) => setFormData({ ...formData, contentValue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={
                    formData.contentType === "image"
                      ? "https://example.com/image.jpg"
                      : formData.contentType === "video"
                      ? "https://www.youtube.com/watch?v=..."
                      : "Enter text content"
                  }
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? "Update" : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSection === "solutions" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Solutions Videos</h2>
              <p className="text-sm text-gray-500">Update the 4 YouTube links used on the Solutions page.</p>
            </div>
            <button
              onClick={handleSaveSolutionVideos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Videos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {solutionVideos.map((value, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium mb-2">
                  Video {idx + 1} URL or ID
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const next = [...solutionVideos];
                    next[idx] = e.target.value;
                    setSolutionVideos(next);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {SECTIONS.find(s => s.value === selectedSection)?.label} - {languages.find(l => l.code === selectedLanguage)?.nativeName || selectedLanguage}
          </h2>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Content
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Field Key</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Value Preview</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No content found. Click "Add Content" to create new content.
                    </td>
                  </tr>
                ) : (
                  content.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{item.fieldKey}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {item.contentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-md truncate">
                          {item.contentType === "image" ? (
                            <img src={item.contentValue} alt={item.fieldKey} className="h-12 w-12 object-cover rounded" />
                          ) : item.contentType === "video" ? (
                            <a href={item.contentValue} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {item.contentValue.substring(0, 50)}...
                            </a>
                          ) : (
                            item.contentValue.substring(0, 100) + (item.contentValue.length > 100 ? "..." : "")
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.displayOrder || 0}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {sectionData && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Preview (Current Language)</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(sectionData.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
