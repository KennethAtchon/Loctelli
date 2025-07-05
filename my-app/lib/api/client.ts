// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { ApiRequestOptions } from './types';
import { API_CONFIG } from '../envUtils';
import { AuthCookies } from '../cookies';

const API_BASE_URL = API_CONFIG.BASE_URL;

export class ApiClient {
  private baseUrl: string;
  private defaultOptions: ApiRequestOptions = {
    timeout: 10000,
    retries: 3,
  };
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Get authentication headers based on available tokens
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Note: API key is now handled server-side by the proxy
    // No need to include it in frontend requests
    
    // Check for admin tokens first (admin takes precedence)
    const adminAccessToken = AuthCookies.getAdminAccessToken();
    if (adminAccessToken) {
      headers['x-user-token'] = adminAccessToken;
      console.log('🔑 Admin token found and added to headers');
      return headers;
    }
    
    // Check for regular user tokens
    const accessToken = AuthCookies.getAccessToken();
    if (accessToken) {
      headers['x-user-token'] = accessToken;
      console.log('🔑 User token found and added to headers');
    } else {
      console.log('ℹ️ No user tokens found');
    }
    
    return headers;
  }

  // Refresh tokens automatically
  private async refreshTokens(): Promise<void> {
    if (this.isRefreshing) {
      // If already refreshing, wait for the existing promise
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    try {
      // Try admin refresh first
      const adminRefreshToken = AuthCookies.getAdminRefreshToken();
      if (adminRefreshToken) {
        // Import dynamically to avoid circular dependency
        const { api } = await import('./index');
        const response = await api.adminAuth.adminRefreshToken(adminRefreshToken);
        AuthCookies.setAdminAccessToken(response.access_token);
        AuthCookies.setAdminRefreshToken(response.refresh_token);
        return;
      }

      // Try regular user refresh
      const refreshToken = AuthCookies.getRefreshToken();
      if (refreshToken) {
        // Import dynamically to avoid circular dependency
        const { api } = await import('./index');
        const response = await api.auth.refreshToken(refreshToken);
        AuthCookies.setAccessToken(response.access_token);
        AuthCookies.setRefreshToken(response.refresh_token);
        return;
      }

      // No valid refresh tokens, clear all auth cookies
      AuthCookies.clearAll();
      throw new Error('No valid refresh token available');
    } catch (error) {
      // Clear all auth cookies on refresh failure
      AuthCookies.clearAll();
      throw error;
    }
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Add auth headers
    const authHeaders = this.getAuthHeaders();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultOptions.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Handle 401 Unauthorized - try to refresh tokens
      if (response.status === 401) {
        try {
          await this.refreshTokens();
          
          // Retry the request with new tokens
          const newAuthHeaders = this.getAuthHeaders();
          const retryConfig: RequestInit = {
            ...config,
            headers: {
              ...config.headers,
              ...newAuthHeaders,
            },
          };
          
          const retryResponse = await fetch(url, {
            ...retryConfig,
            signal: controller.signal,
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${retryResponse.status}, message: ${errorData.message || retryResponse.statusText}`);
          }
          
          return await retryResponse.json();
        } catch (refreshError) {
          // If refresh fails, redirect to login
          if (typeof window !== 'undefined') {
            // Check if we're on an admin page
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            } else {
              window.location.href = '/auth/login';
            }
          }
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your connection and try again.');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }
      
      throw error;
    }
  }

  protected async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async patch<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  protected async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // Helper method to build query strings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    
    return searchParams.toString();
  }
} 