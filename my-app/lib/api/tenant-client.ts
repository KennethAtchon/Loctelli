import { ApiClient } from './client';
import { ApiRequestOptions } from './types';
import logger from '@/lib/logger';

/**
 * Tenant-aware API client that automatically includes tenant headers
 *
 * Usage:
 * - Call setTenantContext() before making requests
 * - Headers will be automatically included
 * - Works for both regular users and admins
 */
export class TenantAwareApiClient extends ApiClient {
  private tenantContext: {
    subAccountId: number | null;
    mode: 'USER_SCOPED' | 'ADMIN_GLOBAL' | 'ADMIN_FILTERED';
  } | null = null;

  /**
   * Set the tenant context for subsequent requests
   * This should be called from components using useTenant()
   */
  setTenantContext(subAccountId: number | null, mode: 'USER_SCOPED' | 'ADMIN_GLOBAL' | 'ADMIN_FILTERED') {
    this.tenantContext = { subAccountId, mode };
    logger.debug('🏢 Tenant context set:', this.tenantContext);
  }

  /**
   * Clear tenant context
   */
  clearTenantContext() {
    this.tenantContext = null;
    logger.debug('🏢 Tenant context cleared');
  }

  /**
   * Get tenant headers to include in requests
   */
  private getTenantHeaders(): Record<string, string> {
    if (!this.tenantContext || !this.tenantContext.subAccountId) {
      return {};
    }

    return {
      'X-SubAccount-Id': this.tenantContext.subAccountId.toString(),
      'X-Tenant-Mode': this.tenantContext.mode,
    };
  }

  /**
   * Override request to include tenant headers
   */
  protected async request<T = unknown>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    // Add tenant headers to the request
    const tenantHeaders = this.getTenantHeaders();

    const enhancedOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...tenantHeaders,
      },
    };

    if (Object.keys(tenantHeaders).length > 0) {
      logger.debug('🏢 Including tenant headers:', tenantHeaders);
    }

    return super.request<T>(endpoint, enhancedOptions);
  }

  /**
   * Helper to build query params with optional tenant filtering
   */
  buildTenantQueryParams(additionalParams: Record<string, unknown> = {}): string {
    const params: Record<string, unknown> = { ...additionalParams };

    // Add subAccountId to query params if in user scope or admin filtered mode
    if (this.tenantContext?.subAccountId) {
      params.subAccountId = this.tenantContext.subAccountId;
    }

    return this.buildQueryString(params);
  }

  /**
   * Get a resource with automatic tenant filtering
   */
  async getTenantScoped<T>(endpoint: string, params?: Record<string, unknown>, options?: ApiRequestOptions): Promise<T> {
    const queryString = this.buildTenantQueryParams(params);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.get<T>(url, options);
  }

  /**
   * Create a resource with automatic tenant context
   */
  async postTenantScoped<T>(endpoint: string, data: Record<string, unknown>, options?: ApiRequestOptions): Promise<T> {
    // Add subAccountId to the data if in tenant scope
    const enhancedData = { ...data };
    if (this.tenantContext?.subAccountId && !enhancedData.subAccountId) {
      enhancedData.subAccountId = this.tenantContext.subAccountId;
    }

    return this.post<T>(endpoint, enhancedData, options);
  }
}

/**
 * Create singleton instance
 */
export const tenantApiClient = new TenantAwareApiClient();

/**
 * Hook to get API client with tenant context automatically applied
 * Must be used within TenantProvider
 */
export function useTenantApiClient() {
  // This will be used in a React hook, so we can't import useTenant directly
  // Instead, components should call setTenantContext when they mount
  return tenantApiClient;
}
