// Use Kong ingress URL for admin backend API with port
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://dev-admin-api.72.62.40.154.nip.io:31416';
const MAIN_BACKEND_URL = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8080';

class AdminApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || `Request failed with status ${response.status}` };
      }
      throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AdminAuthResponse> {
    const response = await this.request<AdminAuthResponse>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  logout() {
    this.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // User management endpoints
  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/api/admin/users');
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

  // Subscription management endpoints
  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.request<Subscription[]>('/api/admin/subscriptions');
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/admin/dashboard/stats');
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
}

export interface AdminAuthResponse {
  token: string;
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
  userTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  customerId?: string;
  createdAt?: string;
  isActive: boolean;
  emailVerified: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planType: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  freeUsers: number;
  premiumUsers: number;
  enterpriseUsers: number;
  pendingAnalysisRequests?: number;
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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
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

export const adminApiClient = new AdminApiClient();
