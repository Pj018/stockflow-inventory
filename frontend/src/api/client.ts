import { Product, DashboardMetrics, Organization, User } from '../types';

const API_BASE_URL = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('stockflow_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: any;
    try {
      data = await response.json();
    } catch (err) {
      data = { message: 'Failed to parse server response' };
    }

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        (data?.errors && data.errors[0]?.message) ||
        `HTTP Error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  }

  // Auth Endpoints
  async login(payload: { email: string; password: string }) {
    return this.request<{
      success: boolean;
      data: { token: string; user: User; organization: Organization };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async signup(payload: {
    email: string;
    password: string;
    confirmPassword: string;
    organizationName: string;
  }) {
    return this.request<{
      success: boolean;
      data: { token: string; user: User; organization: Organization };
    }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMe() {
    return this.request<{
      success: boolean;
      data: { user: User; organization: Organization };
    }>('/auth/me');
  }

  // Dashboard Endpoints
  async getDashboardMetrics() {
    return this.request<{
      success: boolean;
      data: DashboardMetrics;
    }>('/dashboard');
  }

  // Product Endpoints
  async getProducts(params?: { search?: string; lowStockOnly?: boolean }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.lowStockOnly) query.append('lowStockOnly', 'true');

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{
      success: boolean;
      count: number;
      data: Product[];
    }>(`/products${qs}`);
  }

  async getProduct(id: string) {
    return this.request<{
      success: boolean;
      data: Product;
    }>(`/products/${id}`);
  }

  async createProduct(payload: {
    name: string;
    sku: string;
    description?: string | null;
    quantity: number;
    costPrice?: number | null;
    sellingPrice?: number | null;
    lowStockThreshold?: number | null;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: Product;
    }>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProduct(
    id: string,
    payload: {
      name?: string;
      sku?: string;
      description?: string | null;
      quantity?: number;
      costPrice?: number | null;
      sellingPrice?: number | null;
      lowStockThreshold?: number | null;
    }
  ) {
    return this.request<{
      success: boolean;
      message: string;
      data: Product;
    }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async adjustStock(
    id: string,
    payload: { changeAmount: number; note?: string }
  ) {
    return this.request<{
      success: boolean;
      message: string;
      data: { product: Product; log: any };
    }>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteProduct(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings Endpoints
  async getSettings() {
    return this.request<{
      success: boolean;
      data: Organization;
    }>('/settings');
  }

  async updateSettings(payload: {
    defaultLowStockThreshold?: number;
    name?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: Organization;
    }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
