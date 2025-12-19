"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, Language, LanguageRequest } from "@/lib/api";

export default function LanguagesPage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [formData, setFormData] = useState<LanguageRequest>({
    code: "",
    name: "",
    nativeName: "",
    flag: "",
    enabled: true,
    isDefault: false,
  });

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.getAllLanguages();
      setLanguages(data);
    } catch (err: any) {
      console.error("Error loading languages:", err);
      setError(err.message || "Failed to load languages");
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadLanguages();
  }, [router, loadLanguages]);

  const handleCreate = async () => {
    setError(null);
    try {
      const newLanguage = await adminApiClient.createLanguage(formData);
      setLanguages([...languages, newLanguage]);
      setIsCreating(false);
      setFormData({
        code: "",
        name: "",
        nativeName: "",
        flag: "",
        enabled: true,
        isDefault: false,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create language");
    }
  };

  const handleUpdate = async () => {
    if (!editingLanguage) return;
    setError(null);
    try {
      const updated = await adminApiClient.updateLanguage(editingLanguage.id, formData);
      setLanguages(languages.map(l => l.id === editingLanguage.id ? updated : l));
      setIsEditing(false);
      setEditingLanguage(null);
      setFormData({
        code: "",
        name: "",
        nativeName: "",
        flag: "",
        enabled: true,
        isDefault: false,
      });
      // Reload to refresh the list
      loadLanguages();
    } catch (err: any) {
      setError(err.message || "Failed to update language");
    }
  };

  const handleToggle = async (id: string) => {
    setError(null);
    try {
      const updated = await adminApiClient.toggleLanguage(id);
      setLanguages(languages.map(l => l.id === id ? updated : l));
    } catch (err: any) {
      setError(err.message || "Failed to toggle language");
    }
  };

  const handleSetDefault = async (id: string) => {
    setError(null);
    try {
      const updated = await adminApiClient.setLanguageAsDefault(id);
      // Reload to update all default flags
      loadLanguages();
    } catch (err: any) {
      setError(err.message || "Failed to set default language");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this language? This will also delete all its translations.")) return;
    setError(null);
    try {
      await adminApiClient.deleteLanguage(id);
      setLanguages(languages.filter(l => l.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete language");
    }
  };

  const startEdit = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName || "",
      flag: language.flag || "",
      enabled: language.enabled,
      isDefault: language.isDefault,
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreate = () => {
    setFormData({
      code: "",
      name: "",
      nativeName: "",
      flag: "",
      enabled: true,
      isDefault: false,
    });
    setIsCreating(true);
    setIsEditing(false);
    setEditingLanguage(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditingLanguage(null);
    setFormData({
      code: "",
      name: "",
      nativeName: "",
      flag: "",
      enabled: true,
      isDefault: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading languages...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Language Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage available languages for the application</p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            {isEditing ? "Edit Language" : "Create New Language"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., en, ar, fr"
                disabled={isEditing}
              />
              <p className="mt-1 text-xs text-gray-500">ISO language code (e.g., en, ar, fr)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Native Name
              </label>
              <input
                type="text"
                value={formData.nativeName}
                onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., English, العربية, Français"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Flag Emoji
              </label>
              <input
                type="text"
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., 🇬🇧, 🇸🇦, 🇫🇷"
                maxLength={10}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enabled</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Default Language</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={isEditing ? handleUpdate : handleCreate}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              {isEditing ? "Update" : "Create"}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div></div>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          + Add Language
        </button>
      </div>

      {/* Languages Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Native Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Flag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {languages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No languages found. Create your first language.
                  </td>
                </tr>
              ) : (
                languages.map((language) => (
                  <tr key={language.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {language.code}
                      {language.isDefault && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                          DEFAULT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {language.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {language.nativeName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-2xl">
                      {language.flag || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        language.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {language.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => startEdit(language)}
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(language.id)}
                          className={`${language.enabled ? 'text-orange-600' : 'text-green-600'} hover:opacity-80`}
                        >
                          {language.enabled ? 'Disable' : 'Enable'}
                        </button>
                        {!language.isDefault && (
                          <>
                            <button
                              onClick={() => handleSetDefault(language.id)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Set Default
                            </button>
                            <button
                              onClick={() => handleDelete(language.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

