import { ApiRequestOptions } from './types';
import { API_CONFIG } from '../utils/envUtils';
import logger from '@/lib/logger';
import { rateLimiter } from '../utils/rate-limiter';
import { AuthService } from './auth-service';

const API_BASE_URL = API_CONFIG.BASE_URL;

export class ApiClient {
  private baseUrl: string;
  private defaultOptions: ApiRequestOptions = {
    timeout: 10000,
    retries: 3,
  };
  private authService: AuthService;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.authService = new AuthService(baseUrl);
    
    // Clean up expired blocks every minute
    setInterval(() => {
      rateLimiter.cleanup();
    }, 60000);
  }

  protected async request<T = unknown>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const isAuthEndpoint = this.authService.isAuthEndpoint(endpoint);
    
    logger.debug('🌐 API Request:', {
      url,
      method: options.method || 'GET',
      endpoint,
      isAuthEndpoint
    });

    // Check if endpoint is currently rate limited
    rateLimiter.checkRateLimit(endpoint);
    
    // Add auth headers
    const authHeaders = this.authService.getAuthHeaders();
    logger.debug('🔑 Auth headers:', authHeaders);
    
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
      
      logger.debug('📡 Response status:', response.status, response.statusText);
      
      // Handle 401 Unauthorized - but NOT for auth endpoints or refresh requests
      if (response.status === 401 && !this.authService.isInRefreshRequest() && !isAuthEndpoint) {
        logger.debug('🔒 401 Unauthorized, attempting token refresh...');
        try {
          const newAuthHeaders = await this.authService.handleUnauthorized(endpoint);
          
          // Retry the request with new tokens
          logger.debug('🔄 Retrying with new auth headers:', newAuthHeaders);
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
          
          logger.debug('🔄 Retry response status:', retryResponse.status, retryResponse.statusText);
          
          if (!retryResponse.ok) {
            // If retry fails after refresh, redirect to login page
            logger.debug('❌ Retry failed after token refresh, redirecting to login...');
            
            // Clear all tokens since refresh failed
            this.authService.clearAllTokens();
            
            // Redirect to appropriate login page based on current path
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/admin')) {
              window.location.href = '/admin/login';
            } else {
              window.location.href = '/auth/login';
            }
            
            // Throw error to stop execution
            throw new Error('Authentication failed. Redirecting to login page.');
          }
          
          return await retryResponse.json();
        } catch (refreshError) {
          logger.debug('❌ Token refresh failed:', refreshError);
          // Don't automatically redirect - let the components handle this
          // This prevents page refreshes that lose error state
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          rateLimiter.handleRateLimitError(endpoint, response, errorData);
        }
        
        // For auth endpoints, use simpler error logging to avoid noise
        if (isAuthEndpoint) {
          logger.debug('❌ Auth endpoint failed:', {
            status: response.status,
            endpoint
          });
        } else {
          logger.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
        }
        
        // Extract error message from different possible formats
        let errorMessage = response.statusText;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      // For auth endpoints, use simpler error logging to avoid noise
      if (isAuthEndpoint) {
        logger.debug('❌ Auth request failed:', error);
      } else {
        logger.error('❌ API request failed:', error);
      }
      
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

  protected async post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    logger.debug('📤 POST Request:', {
      endpoint,
      data: data ? JSON.stringify(data, null, 2) : 'No data'
    });
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  protected async patch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  protected async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  protected async put<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // Helper method to build query strings
  protected buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    
    return searchParams.toString();
  }
} 