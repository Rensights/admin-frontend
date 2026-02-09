"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiClient, Article } from "@/lib/api";

const emptyForm: Partial<Article> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  publishedAt: "",
  isActive: true,
};

export default function ArticlesAdminPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Article>>(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, settings] = await Promise.all([
        adminApiClient.getArticles(),
        adminApiClient.getArticlesEnabled(),
      ]);
      setArticles(list);
      setEnabled(settings.enabled);
    } catch (err: any) {
      setError(err.message || "Failed to load articles");
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router, loadData]);

  const resetForm = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (!form.title || !form.slug) {
        setError("Title and Slug are required");
        return;
      }
      if (editingId) {
        const updated = await adminApiClient.updateArticle(editingId, form);
        setArticles(articles.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await adminApiClient.createArticle(form);
        setArticles([created, ...articles]);
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save article");
    }
  };

  const handleEdit = (article: Article) => {
    setIsEditing(true);
    setEditingId(article.id);
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || "",
      content: article.content || "",
      coverImage: article.coverImage || "",
      publishedAt: article.publishedAt || "",
      isActive: article.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    setError(null);
    try {
      await adminApiClient.deleteArticle(id);
      setArticles(articles.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete article");
    }
  };

  const handleToggleActive = async (article: Article) => {
    try {
      const updated = await adminApiClient.updateArticle(article.id, {
        isActive: !article.isActive,
      });
      setArticles(articles.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const next = !enabled;
      const result = await adminApiClient.setArticlesEnabled(next);
      setEnabled(result.enabled);
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    }
  };

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [articles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-500">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Articles</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage public articles and toggle visibility
          </p>
        </div>
        <button
          onClick={handleToggleEnabled}
          className="px-4 py-2 rounded-lg text-white transition-colors"
          style={{ background: enabled ? "#16a34a" : "#ef4444" }}
        >
          {enabled ? "Articles Enabled" : "Articles Disabled"}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          {isEditing ? "Edit Article" : "Create Article"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.slug || ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cover Image URL
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.coverImage || ""}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Published At
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.publishedAt ? form.publishedAt.slice(0, 16) : ""}
              onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Excerpt
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              value={form.excerpt || ""}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={8}
              value={form.content || ""}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            {isEditing ? "Update" : "Create"}
          </button>
          {isEditing && (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {sortedArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No articles found
                  </td>
                </tr>
              ) : (
                sortedArticles.map((article) => (
                  <tr key={article.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{article.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{article.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {article.publishedAt ? new Date(article.publishedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleActive(article)}
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          article.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {article.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <button
                        onClick={() => handleEdit(article)}
                        className="text-brand-600 hover:text-brand-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
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
