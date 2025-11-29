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
  async getAllUsers(page: number = 0, size: number = 100): Promise<{ content: User[]; totalElements: number; totalPages: number }> {
    const response = await this.request<any>(`/api/admin/users?page=${page}&size=${size}`);
    // Handle both paginated response (Page) and array response
    if (response.content && Array.isArray(response.content)) {
      return response;
    } else if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    return { content: [], totalElements: 0, totalPages: 0 };
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
  async getAllSubscriptions(page: number = 0, size: number = 100): Promise<{ content: Subscription[]; totalElements: number; totalPages: number }> {
    const response = await this.request<any>(`/api/admin/subscriptions?page=${page}&size=${size}`);
    // Handle both paginated response (Page) and array response
    if (response.content && Array.isArray(response.content)) {
      return response;
    } else if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/admin/stats');
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
}

export const adminApiClient = new AdminApiClient();

