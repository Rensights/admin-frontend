"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, Translation, TranslationRequest } from "@/lib/api";

export default function TranslationsPage() {
  const router = useRouter();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("common");
  const [languages, setLanguages] = useState<string[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<TranslationRequest>({
    languageCode: "en",
    namespace: "common",
    translationKey: "",
    translationValue: "",
    description: "",
  });

  const loadLanguages = useCallback(async () => {
    try {
      const langs = await adminApiClient.getEnabledLanguages();
      const langCodes = langs.map(l => l.code);
      setLanguages(langCodes.length > 0 ? langCodes : ["en"]);
      if (langCodes.length > 0 && !langCodes.includes(selectedLanguage)) {
        setSelectedLanguage(langCodes[0]);
      }
    } catch (err: any) {
      console.error("Error loading languages:", err);
      setLanguages(["en"]);
    }
  }, [selectedLanguage]);

  const loadNamespaces = useCallback(async () => {
    try {
      const ns = await adminApiClient.getNamespaces(selectedLanguage);
      setNamespaces(ns.length > 0 ? ns : ["common"]);
      if (ns.length > 0 && !ns.includes(selectedNamespace)) {
        setSelectedNamespace(ns[0]);
      }
    } catch (err: any) {
      console.error("Error loading namespaces:", err);
      setNamespaces(["common"]);
    }
  }, [selectedLanguage, selectedNamespace]);

  const loadTranslations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.getTranslationsByLanguage(selectedLanguage);
      setTranslations(data);
      // Update namespaces from loaded translations
      const uniqueNamespaces = Array.from(new Set(data.map(t => t.namespace)));
      if (uniqueNamespaces.length > 0) {
        setNamespaces(uniqueNamespaces);
      }
    } catch (err: any) {
      console.error("Error loading translations:", err);
      setError(err.message || "Failed to load translations");
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, router]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadLanguages();
  }, [router, loadLanguages]);

  useEffect(() => {
    if (selectedLanguage) {
      loadNamespaces();
      loadTranslations();
    }
  }, [selectedLanguage, loadNamespaces, loadTranslations]);

  const filteredTranslations = translations.filter(
    t => t.namespace === selectedNamespace
  );

  const handleCreate = async () => {
    setError(null);
    try {
      const newTranslation = await adminApiClient.createTranslation({
        ...formData,
        languageCode: selectedLanguage,
        namespace: selectedNamespace,
      });
      setTranslations([...translations, newTranslation]);
      setIsCreating(false);
      setFormData({
        languageCode: selectedLanguage,
        namespace: selectedNamespace,
        translationKey: "",
        translationValue: "",
        description: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create translation");
    }
  };

  const handleUpdate = async () => {
    if (!editingTranslation) return;
    setError(null);
    try {
      const updated = await adminApiClient.updateTranslation(editingTranslation.id, {
        ...formData,
        languageCode: selectedLanguage,
        namespace: selectedNamespace,
      });
      setTranslations(translations.map(t => t.id === editingTranslation.id ? updated : t));
      setIsEditing(false);
      setEditingTranslation(null);
      setFormData({
        languageCode: selectedLanguage,
        namespace: selectedNamespace,
        translationKey: "",
        translationValue: "",
        description: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to update translation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this translation?")) return;
    setError(null);
    try {
      await adminApiClient.deleteTranslation(id);
      setTranslations(translations.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete translation");
    }
  };

  const startEdit = (translation: Translation) => {
    setEditingTranslation(translation);
    setFormData({
      languageCode: translation.languageCode,
      namespace: translation.namespace,
      translationKey: translation.translationKey,
      translationValue: translation.translationValue,
      description: translation.description || "",
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreate = () => {
    setFormData({
      languageCode: selectedLanguage,
      namespace: selectedNamespace,
      translationKey: "",
      translationValue: "",
      description: "",
    });
    setIsCreating(true);
    setIsEditing(false);
    setEditingTranslation(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditingTranslation(null);
    setFormData({
      languageCode: selectedLanguage,
      namespace: selectedNamespace,
      translationKey: "",
      translationValue: "",
      description: "",
    });
  };

  if (loading && translations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Translations Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage translations for all languages</p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Namespace
          </label>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            {namespaces.map(ns => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          + Add Translation
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            {isEditing ? "Edit Translation" : "Create New Translation"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Translation Key
              </label>
              <input
                type="text"
                value={formData.translationKey}
                onChange={(e) => setFormData({ ...formData, translationKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., welcome.message"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Translation Value
              </label>
              <textarea
                value={formData.translationValue}
                onChange={(e) => setFormData({ ...formData, translationValue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                placeholder="Enter the translated text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Context or notes about this translation"
              />
            </div>
            <div className="flex gap-2">
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
        </div>
      )}

      {/* Translations Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {filteredTranslations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No translations found for {selectedLanguage}/{selectedNamespace}
                  </td>
                </tr>
              ) : (
                filteredTranslations.map((translation) => (
                  <tr key={translation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {translation.translationKey}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {translation.translationValue}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {translation.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEdit(translation)}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(translation.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
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

