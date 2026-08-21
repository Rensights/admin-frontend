import { logError, logInfo } from "./logger";

const createTraceId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `trace-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const MAIN_BACKEND_URL = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || '';
// Public site domain - article images are viewed on the public site, so they
// must be served from here (same-origin /api/* on rensights.com), not from
// MAIN_BACKEND_URL, which can point at a different internal API host per
// environment and isn't guaranteed to have a matching TLS cert.
const PUBLIC_SITE_URL = 'https://rensights.com';

class AdminApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const startedAt = Date.now();
    const traceId = createTraceId();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (!headers['X-Trace-Id']) {
      headers['X-Trace-Id'] = traceId;
    }

    logInfo("admin.api.request.start", {
      method: options.method || "GET",
      endpoint,
      traceId,
    });

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      logError("admin.api.request.error", {
        method: options.method || "GET",
        endpoint,
        status: response.status,
        durationMs: Date.now() - startedAt,
        traceId,
      });
      const errorText = await response.text().catch(() => 'Unknown error');
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || `Request failed with status ${response.status}` };
      }
      throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
    }

    logInfo("admin.api.request.success", {
      method: options.method || "GET",
      endpoint,
      status: response.status,
      durationMs: Date.now() - startedAt,
      traceId,
    });

    const responseText = await response.text();
    if (!responseText) {
      return undefined as T;
    }
    try {
      return JSON.parse(responseText) as T;
    } catch {
      return responseText as unknown as T;
    }
  }

  getBaseUrl() {
    return API_URL;
  }

  getMainBackendUrl() {
    return MAIN_BACKEND_URL;
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AdminAuthResponse> {
    return this.request<AdminAuthResponse>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/api/admin/auth/logout', {
        method: 'POST',
      });
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  async getMe(): Promise<AdminAuthResponse> {
    return this.request<AdminAuthResponse>('/api/admin/auth/me');
  }

  // User management endpoints
  async getAllUsers(page: number = 0, size: number = 20): Promise<PaginatedResponse<User>> {
    return this.request<PaginatedResponse<User>>(`/api/admin/users?page=${page}&size=${size}`);
  }

  async getUserById(userId: string): Promise<User> {
    return this.request<User>(`/api/admin/users/${userId}`);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return this.request<User>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Permanently erase a user account (GDPR right to erasure). Irreversible.
   *
   * The admin backend delegates to the main backend, which cancels any Stripe subscription
   * immediately (no refund), deletes the personal data and uploaded documents, and keeps the
   * invoices without personal details. Fails without deleting anything if billing cannot be
   * cancelled.
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return this.request<Subscription[]>(`/api/admin/users/${userId}/subscriptions`);
  }

  // Subscription management endpoints
  async getAllSubscriptions(page: number = 0, size: number = 20): Promise<PaginatedResponse<Subscription>> {
    return this.request<PaginatedResponse<Subscription>>(`/api/admin/subscriptions?page=${page}&size=${size}`);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/admin/dashboard/stats');
  }

  // Customer analytics (DAU/MAU, per-customer login stats/history)
  async getCustomerAnalyticsSummary(): Promise<CustomerAnalyticsSummary> {
    return this.request<CustomerAnalyticsSummary>('/api/admin/customer-analytics/summary');
  }

  async getCustomerAnalyticsTrend(days: number = 30): Promise<DailyActiveUsersPoint[]> {
    return this.request<DailyActiveUsersPoint[]>(`/api/admin/customer-analytics/trend?days=${days}`);
  }

  async getCustomerLoginStats(page: number = 0, size: number = 20): Promise<PaginatedResponse<CustomerLoginStat>> {
    return this.request<PaginatedResponse<CustomerLoginStat>>(
      `/api/admin/customer-analytics/customers?page=${page}&size=${size}`
    );
  }

  async getUserLoginSummary(userId: string): Promise<UserLoginSummary> {
    return this.request<UserLoginSummary>(`/api/admin/customer-analytics/customers/${userId}/summary`);
  }

  async getUserLoginHistory(userId: string, page: number = 0, size: number = 20): Promise<PaginatedResponse<LoginEvent>> {
    return this.request<PaginatedResponse<LoginEvent>>(
      `/api/admin/customer-analytics/customers/${userId}/history?page=${page}&size=${size}`
    );
  }

  async getMonthlyActiveTrend(months: number = 12): Promise<MonthlyActiveUsersPoint[]> {
    return this.request<MonthlyActiveUsersPoint[]>(
      `/api/admin/customer-analytics/trend/monthly-active?months=${months}`
    );
  }

  async getCustomerGrowthTrend(months: number = 12): Promise<CustomerGrowthPoint[]> {
    return this.request<CustomerGrowthPoint[]>(
      `/api/admin/customer-analytics/trend/customer-growth?months=${months}`
    );
  }

  // Full per-customer login stats (all users) streamed as a CSV download.
  async downloadCustomerLoginStatsCsv(): Promise<void> {
    const res = await fetch(`${API_URL}/api/admin/customer-analytics/customers/export`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to download export (status ${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-login-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Full export: every login + activity event across all customers, one row per
  // event with the owning customer's details, in a single CSV.
  async downloadFullCustomerExport(): Promise<void> {
    const res = await fetch(`${API_URL}/api/admin/customer-analytics/customers/export-all`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to download full export (status ${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-analytics-full-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async getPageViewStats(days: number = 30): Promise<PageViewStat[]> {
    return this.request<PageViewStat[]>(`/api/admin/customer-analytics/page-views?days=${days}`);
  }

  async getEventTypeBreakdown(days: number = 30): Promise<EventTypeStat[]> {
    return this.request<EventTypeStat[]>(`/api/admin/customer-analytics/event-breakdown?days=${days}`);
  }

  async getUserActivityTimeline(userId: string, page: number = 0, size: number = 20): Promise<PaginatedResponse<ActivityTimelineItem>> {
    return this.request<PaginatedResponse<ActivityTimelineItem>>(
      `/api/admin/customer-analytics/customers/${userId}/timeline?page=${page}&size=${size}`
    );
  }

  // Sync all users invoices
  async syncAllUsersInvoices(): Promise<{ message: string; syncedCount: number }> {
    return this.request<{ message: string; syncedCount: number }>('/api/admin/invoices/sync-all', {
      method: 'POST',
    });
  }

  // Analysis request endpoints
  async getAllAnalysisRequests(page: number = 0, size: number = 20): Promise<PaginatedResponse<AnalysisRequest>> {
    return this.request<PaginatedResponse<AnalysisRequest>>(`/api/admin/analysis-requests?page=${page}&size=${size}`);
  }

  async getAnalysisRequestById(requestId: string): Promise<AnalysisRequest> {
    return this.request<AnalysisRequest>(`/api/admin/analysis-requests/${requestId}`);
  }

  async updateAnalysisRequestStatus(requestId: string, status: string): Promise<AnalysisRequest> {
    return this.request<AnalysisRequest>(`/api/admin/analysis-requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async refreshAnalysisResult(requestId: string): Promise<AnalysisRequest> {
    return this.request<AnalysisRequest>(`/api/admin/analysis-requests/${requestId}/analysis-result`, {
      method: 'POST',
    });
  }

  /**
   * Save an admin's manual corrections. The payload is the mapped view; the backend writes it
   * back onto the analysis payload, so a re-fetch from the module discards these edits.
   */
  async updateAnalysisResult(requestId: string, analysis: AnalysisReportView): Promise<AnalysisRequest> {
    return this.request<AnalysisRequest>(`/api/admin/analysis-requests/${requestId}/analysis-result`, {
      method: 'PUT',
      body: JSON.stringify(analysis),
    });
  }

  // Deal management endpoints
  async getPendingDeals(page: number = 0, size: number = 20, city?: string): Promise<PaginatedResponse<Deal>> {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    return this.request<PaginatedResponse<Deal>>(`/api/admin/deals/pending?page=${page}&size=${size}${cityParam}`);
  }

  async getTodayPendingDeals(page: number = 0, size: number = 20): Promise<PaginatedResponse<Deal>> {
    return this.request<PaginatedResponse<Deal>>(`/api/admin/deals/pending/today?page=${page}&size=${size}`);
  }

  async getRejectedDeals(page: number = 0, size: number = 20, city?: string): Promise<PaginatedResponse<Deal>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (city) params.append('city', city);
    return this.request<PaginatedResponse<Deal>>(`/api/admin/deals/rejected?${params.toString()}`);
  }

  async getDealById(dealId: string): Promise<Deal> {
    return this.request<Deal>(`/api/admin/deals/${dealId}`);
  }

  async updateDeal(dealId: string, updates: Partial<Deal>): Promise<Deal> {
    return this.request<Deal>(`/api/admin/deals/${dealId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async approveDeal(dealId: string): Promise<Deal> {
    return this.request<Deal>(`/api/admin/deals/${dealId}/approve`, {
      method: 'POST',
    });
  }

  async approveDeals(dealIds: string[]): Promise<{ approvedCount: number; deals: Deal[] }> {
    return this.request<{ approvedCount: number; deals: Deal[] }>(`/api/admin/deals/batch-approve`, {
      method: 'POST',
      body: JSON.stringify({ dealIds }),
    });
  }

  async rejectDeal(dealId: string): Promise<Deal> {
    return this.request<Deal>(`/api/admin/deals/${dealId}/reject`, {
      method: 'POST',
    });
  }

  async getApprovedDeals(page: number = 0, size: number = 20, city?: string, active?: boolean): Promise<PaginatedResponse<Deal>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (city) params.append('city', city);
    if (active !== undefined) params.append('active', active.toString());
    return this.request<PaginatedResponse<Deal>>(`/api/admin/deals/approved?${params.toString()}`);
  }

  async setWeeklyDealsEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>(`/api/admin/weekly-deals/enable?enabled=${enabled}`, {
      method: "PUT",
    });
  }

  async getWeeklyDealsEnabled(): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>(`/api/admin/weekly-deals/enable`);
  }

  async getGoogleAnalyticsMeasurementId(): Promise<{ measurementId: string }> {
    return this.request<{ measurementId: string }>(`/api/admin/settings/google-analytics`);
  }

  async setGoogleAnalyticsMeasurementId(measurementId: string): Promise<{ measurementId: string }> {
    return this.request<{ measurementId: string }>(`/api/admin/settings/google-analytics`, {
      method: "PUT",
      body: JSON.stringify({ measurementId }),
    });
  }

  async deleteDeal(dealId: string): Promise<void> {
    return this.request<void>(`/api/admin/deals/${dealId}`, {
      method: 'DELETE',
    });
  }

  async deactivateDeal(dealId: string): Promise<Deal> {
    return this.request<Deal>(`/api/admin/deals/${dealId}/deactivate`, {
      method: 'POST',
    });
  }

  async activateDeal(dealId: string): Promise<Deal> {
    return this.request<Deal>(`/api/admin/deals/${dealId}/activate`, {
      method: 'POST',
    });
  }

  // Test data endpoints
  async seedTestDeals(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/admin/test/seed-deals', {
      method: 'POST',
    });
  }

  async deleteAllDeals(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/admin/test/delete-all-deals', {
      method: 'DELETE',
    });
  }

  // Translation management endpoints (admin backend)
  async getAllTranslations(): Promise<Translation[]> {
    return this.request<Translation[]>('/api/admin/translations');
  }

  async getTranslationsByLanguage(languageCode: string): Promise<Translation[]> {
    return this.request<Translation[]>(`/api/admin/translations/language/${languageCode}`);
  }

  async getTranslationsByLanguageAndNamespace(languageCode: string, namespace: string): Promise<TranslationsResponse> {
    // Use main backend for public read (frontend needs this)
    const url = `${MAIN_BACKEND_URL}/api/translations/${languageCode}/${namespace}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
  }

  async createTranslation(request: TranslationRequest): Promise<Translation> {
    return this.request<Translation>('/api/admin/translations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateTranslation(id: string, request: TranslationRequest): Promise<Translation> {
    return this.request<Translation>(`/api/admin/translations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteTranslation(id: string): Promise<void> {
    return this.request<void>(`/api/admin/translations/${id}`, {
      method: 'DELETE',
    });
  }

  async seedTranslations(
    sourceLanguageCode: string,
    targetLanguageCode: string,
    overwrite: boolean = false
  ): Promise<Translation[]> {
    return this.request<Translation[]>('/api/admin/translations/seed', {
      method: 'POST',
      body: JSON.stringify({ sourceLanguageCode, targetLanguageCode, overwrite }),
    });
  }

  async getAvailableLanguages(): Promise<string[]> {
    return this.request<string[]>('/api/admin/translations/languages');
  }

  async getNamespaces(languageCode: string): Promise<string[]> {
    return this.request<string[]>(`/api/admin/translations/language/${languageCode}/namespaces`);
  }

  // Language management endpoints (admin backend)
  async getAllLanguages(): Promise<Language[]> {
    return this.request<Language[]>('/api/admin/languages');
  }

  async getEnabledLanguages(): Promise<Language[]> {
    // Use main backend for public read (frontend needs this)
    const url = `${MAIN_BACKEND_URL}/api/languages`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
  }

  async getLanguageByCode(code: string): Promise<Language> {
    return this.request<Language>(`/api/admin/languages/${code}`);
  }

  async createLanguage(request: LanguageRequest): Promise<Language> {
    return this.request<Language>('/api/admin/languages', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateLanguage(id: string, request: LanguageRequest): Promise<Language> {
    return this.request<Language>(`/api/admin/languages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async toggleLanguage(id: string): Promise<Language> {
    return this.request<Language>(`/api/admin/languages/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async setLanguageAsDefault(id: string): Promise<Language> {
    return this.request<Language>(`/api/admin/languages/${id}/set-default`, {
      method: 'PATCH',
    });
  }

  async deleteLanguage(id: string): Promise<void> {
    return this.request<void>(`/api/admin/languages/${id}`, {
      method: 'DELETE',
    });
  }

  // Landing Page Content Management
  async getAllLandingPageContent(): Promise<LandingPageContent[]> {
    return this.request<LandingPageContent[]>(`/api/admin/landing-page`);
  }

  async getLandingPageContentBySection(section: string): Promise<LandingPageContent[]> {
    return this.request<LandingPageContent[]>(`/api/admin/landing-page/section/${section}`);
  }

  async getLandingPageSection(section: string, languageCode: string): Promise<LandingPageSection> {
    return this.request<LandingPageSection>(`/api/admin/landing-page/section/${section}/language/${languageCode}`);
  }

  async getAllLandingPageSections(languageCode: string): Promise<Record<string, LandingPageSection>> {
    return this.request<Record<string, LandingPageSection>>(`/api/admin/landing-page/language/${languageCode}`);
  }

  async createOrUpdateLandingPageContent(request: LandingPageContentRequest): Promise<LandingPageContent> {
    return this.request<LandingPageContent>('/api/admin/landing-page', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateLandingPageContent(id: string, request: LandingPageContentRequest): Promise<LandingPageContent> {
    return this.request<LandingPageContent>(`/api/admin/landing-page/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteLandingPageContent(id: string): Promise<void> {
    return this.request<void>(`/api/admin/landing-page/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLandingPageSection(section: string, languageCode: string): Promise<void> {
    return this.request<void>(`/api/admin/landing-page/section/${section}/language/${languageCode}`, {
      method: 'DELETE',
    });
  }

  async getEarlyAccessRequests(page: number = 0, size: number = 50): Promise<PaginatedResponse<EarlyAccessRequest>> {
    const url = `${MAIN_BACKEND_URL}/api/early-access?page=${page}&size=${size}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
  }

  async getArticles(): Promise<Article[]> {
    const list = await this.request<any[]>(`/api/admin/articles`);
    return Array.isArray(list) ? list.map((item) => this.normalizeArticle(item)) : [];
  }

  async uploadArticleImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const result = await this.request<{ filename: string }>(`/api/admin/articles/upload-image`, {
      method: "POST",
      body: formData,
    });
    // Images are viewed on the public site, so they must be served from
    // rensights.com, not from this admin API.
    return `${PUBLIC_SITE_URL}/api/articles/images/${result.filename}`;
  }

  async createArticle(payload: Partial<Article>): Promise<Article> {
    const created = await this.request<any>(`/api/admin/articles/create`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.normalizeArticle(created);
  }

  async updateArticle(id: string, payload: Partial<Article>): Promise<Article> {
    const updated = await this.request<any>(`/api/admin/articles/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return this.normalizeArticle(updated);
  }

  async deleteArticle(id: string): Promise<void> {
    await this.request<void>(`/api/admin/articles/delete?id=${id}`, {
      method: "DELETE",
    });
  }

  async setArticlesEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>(`/api/admin/articles/enable?enabled=${enabled}`, {
      method: "PUT",
    });
  }

  async getArticlesEnabled(): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>(`/api/admin/articles/enable`);
  }

  async setArticleEnabled(id: string, enabled: boolean): Promise<Article> {
    const updated = await this.request<any>(`/api/admin/articles/enable/${id}?enabled=${enabled}`, {
      method: "PUT",
    });
    return this.normalizeArticle(updated);
  }

  // City report management endpoints
  async getReportSections(languageCode: string = "en"): Promise<ReportSection[]> {
    return this.request<ReportSection[]>(`/api/admin/reports/sections?lang=${encodeURIComponent(languageCode)}`);
  }

  async getReportSection(sectionId: string): Promise<ReportSection> {
    return this.request<ReportSection>(`/api/admin/reports/sections/${sectionId}`);
  }

  async createReportSection(request: ReportSectionRequest): Promise<ReportSection> {
    return this.request<ReportSection>(`/api/admin/reports/sections`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async updateReportSection(sectionId: string, request: ReportSectionRequest): Promise<ReportSection> {
    return this.request<ReportSection>(`/api/admin/reports/sections/${sectionId}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  async deleteReportSection(sectionId: string): Promise<void> {
    await this.request<void>(`/api/admin/reports/sections/${sectionId}`, {
      method: "DELETE",
    });
  }

  async uploadReportDocument(
    sectionId: string,
    request: ReportDocumentRequest,
    file: File
  ): Promise<ReportDocument> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "metadata",
      new Blob([JSON.stringify(request)], { type: "application/json" })
    );
    return this.request<ReportDocument>(`/api/admin/reports/sections/${sectionId}/documents`, {
      method: "POST",
      body: formData,
    });
  }

  async updateReportDocument(documentId: string, request: ReportDocumentRequest): Promise<ReportDocument> {
    return this.request<ReportDocument>(`/api/admin/reports/documents/${documentId}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  async deleteReportDocument(documentId: string): Promise<void> {
    await this.request<void>(`/api/admin/reports/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  private normalizeArticle(article: any): Article {
    return {
      ...article,
      isActive: article?.isActive ?? article?.active ?? false,
    };
  }
}

export interface AdminAuthResponse {
  email: string;
  firstName?: string;
  lastName?: string;
  isSuperAdmin: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  budget?: string;
  portfolio?: string;
  goals?: string[];
  registrationPlan?: string;
  userTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  customerId?: string;
  createdAt?: string;
  isActive: boolean;
  emailVerified: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  userEmail?: string;
  planType: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  endDate?: string;
  createdAt: string;
  stripeSubscriptionId?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  freeUsers: number;
  premiumUsers: number;
  enterpriseUsers: number;
  activeUsers?: number;
  verifiedUsers?: number;
  pendingAnalysisRequests?: number;
  monthlyIncome?: { month: string; income: number }[];
  dailyIncome?: { date: string; income: number }[];
  deviceTypeStats?: { type: string; count: number }[];
  monthlyUserRegistrations?: { month: string; free: number; premium: number; enterprise: number }[];
  dailyUserRegistrations?: { date: string; free: number; premium: number; enterprise: number }[];
  subscriptionStatusStats?: { status: string; count: number }[];
}

export interface CustomerAnalyticsSummary {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalUsers: number;
  activeNow: number;
}

export interface PageViewStat {
  pagePath: string;
  viewCount: number;
}

export interface EventTypeStat {
  eventType: string;
  eventCount: number;
}

export interface ActivityTimelineItem {
  eventType: string;
  pagePath?: string;
  metadata?: string;
  occurredAt: string;
}

export interface DailyActiveUsersPoint {
  date: string;
  activeUsers: number;
}

export interface MonthlyActiveUsersPoint {
  month: string; // "YYYY-MM"
  activeUsers: number;
}

export interface CustomerGrowthPoint {
  month: string; // "YYYY-MM"
  newCustomers: number;
  cumulativeCustomers: number;
}

export interface CustomerLoginStat {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  loginCount: number;
  lastLoginAt?: string;
}

export interface UserLoginSummary {
  loginCount: number;
  lastLoginAt?: string;
}

export interface LoginEvent {
  loggedInAt: string;
  ipAddress?: string;
}

export interface ReportDocument {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  filePath?: string;
  originalFilename?: string;
  fileSize?: number;
  displayOrder: number;
  languageCode: string;
  isActive?: boolean;
}

export interface ReportSection {
  id: string;
  sectionKey: string;
  title: string;
  navTitle: string;
  description?: string;
  accessTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  displayOrder: number;
  languageCode: string;
  isActive?: boolean;
  documents?: ReportDocument[];
}

export interface ReportSectionRequest {
  sectionKey: string;
  title: string;
  navTitle: string;
  description?: string;
  accessTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  displayOrder: number;
  languageCode: string;
  isActive?: boolean;
}

export interface ReportDocumentRequest {
  title: string;
  description?: string;
  displayOrder: number;
  languageCode: string;
  isActive?: boolean;
}

/** A "Listing" / "Transaction" comparable as the backend maps it for the report. */
export interface AnalysisComparable {
  buildingName?: string;
  area?: string;
  bedrooms?: string;
  sizeDisplay?: string;
  listedPriceDisplay?: string;
  salePriceDisplay?: string;
  pricePerSqftDisplay?: string;
  listingUrl?: string;
  transactionDate?: string;
}

/**
 * The analysis module's payload mapped to the shape the user's report renders
 * (backend: AnalysisResultMapper). Values arrive display-ready — show them as they are.
 */
export interface AnalysisReportView {
  buildingName?: string;
  area?: string;
  city?: string;
  bedrooms?: string;
  size?: string;
  buildingStatus?: string;
  marketGapPercentage?: string;
  marketDirectionLabel?: string;
  rentalYield?: string;
  listedPrice?: string;
  estimateRange?: string;
  potentialSavings?: string;
  pricePerSqft?: string;
  marketPosition?: string;
  dubaiComparison?: string;
  valuationWarning?: { title?: string; message?: string } | null;
  furnishing?: string;
  developer?: string;
  view?: string;
  serviceCharge?: string;
  nearestLandmark?: string;
  buildingFeatures?: string;
  listingComparables?: AnalysisComparable[];
  transactionComparables?: AnalysisComparable[];
}

export interface AnalysisRequest {
  id: string;
  userId?: string;
  email: string;
  city: string;
  area: string;
  buildingName: string;
  listingUrl?: string;
  propertyType: string;
  bedrooms: string;
  size?: string;
  plotSize?: string;
  floor?: string;
  totalFloors?: string;
  buildingStatus: string;
  condition: string;
  latitude?: string;
  longitude?: string;
  askingPrice: string;
  serviceCharge?: string;
  handoverDate?: string;
  developer?: string;
  paymentPlan?: string;
  features?: string[];
  view?: string;
  furnishing?: string;
  additionalNotes?: string;
  filePaths?: string[];
  analysisId?: string;
  /** The raw module payload; the review screen still reads its admin-only fields from here. */
  analysisResult?: any;
  analysis?: AnalysisReportView | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface EarlyAccessRequest {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location: string;
  experience?: string;
  budget?: string;
  portfolio?: string;
  timeline?: string;
  goals?: string[];
  propertyTypes?: string[];
  targetRegions?: string;
  challenges?: string;
  valuableServices?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  publishedAt?: string;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Deal {
  active?: boolean;
  id: string;
  name: string;
  location: string;
  city: string;
  area: string;
  bedrooms: string;
  bedroomCount?: string;
  size: string;
  listedPrice: string;
  priceValue: number;
  estimateMin?: number;
  estimateMax?: number;
  estimateRange?: string;
  discount?: string;
  rentalYield?: string;
  buildingStatus: 'READY' | 'OFF_PLAN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  batchDate?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageContent {
  id: string;
  section: string;
  languageCode: string;
  fieldKey: string;
  contentType: 'text' | 'image' | 'video' | 'json';
  contentValue: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageContentRequest {
  section: string;
  languageCode: string;
  fieldKey: string;
  contentType: 'text' | 'image' | 'video' | 'json';
  contentValue: string;
  displayOrder?: number;
  isActive: boolean;
}

export interface LandingPageSection {
  section: string;
  languageCode: string;
  content: Record<string, any>;
}

export interface Translation {
  id: string;
  languageCode: string;
  namespace: string;
  translationKey: string;
  translationValue: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationRequest {
  languageCode: string;
  namespace: string;
  translationKey: string;
  translationValue: string;
  description?: string;
}

export interface TranslationsResponse {
  languageCode: string;
  namespace: string;
  translations: Record<string, string>;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LanguageRequest {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  enabled?: boolean;
  isDefault?: boolean;
}

export const adminApiClient = new AdminApiClient();
