// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { ApiRequestOptions } from './types';
import { API_CONFIG } from '../envUtils';

const API_BASE_URL = API_CONFIG.BASE_URL;

export class ApiClient {
  private baseUrl: string;
  private defaultOptions: ApiRequestOptions = {
    timeout: 10000,
    retries: 3,
  };

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }
} 