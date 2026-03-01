import { ApiClient } from "./client";
import logger from "@/lib/logger";

/**
 * Tenant-aware API client that automatically includes tenant headers
 *
 * Usage:
 * - Call setTenantContext() before making requests
 * - Headers will be automatically included
 * - Works for both regular users and admins
 */
export class TenantAwareApiClient {
  private static instance: TenantAwareApiClient | null = null;
  private apiClient: ApiClient;
  private tenantContext: {
    subAccountId: number | null;
    mode: "USER_SCOPED" | "ADMIN_GLOBAL" | "ADMIN_FILTERED";
  } | null = null;

  private constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  static getInstance(): TenantAwareApiClient {
    if (!TenantAwareApiClient.instance) {
      TenantAwareApiClient.instance = new TenantAwareApiClient();
    }
    return TenantAwareApiClient.instance;
  }

  /**
   * Set the tenant context for subsequent requests
   * This should be called from components using useTenant()
   */
  setTenantContext(
    subAccountId: number | null,
    mode: "USER_SCOPED" | "ADMIN_GLOBAL" | "ADMIN_FILTERED"
  ) {
    this.tenantContext = { subAccountId, mode };
    logger.debug("🏢 Tenant context set:", this.tenantContext);
  }

  /**
   * Clear tenant context
   */
  clearTenantContext() {
    this.tenantContext = null;
    logger.debug("🏢 Tenant context cleared");
  }

  /**
   * Get tenant headers to include in requests
   */
  private getTenantHeaders(): Record<string, string> {
    if (!this.tenantContext || !this.tenantContext.subAccountId) {
      return {};
    }

    return {
      "X-SubAccount-Id": this.tenantContext.subAccountId.toString(),
      "X-Tenant-Mode": this.tenantContext.mode,
    };
  }

  /**
   * Delegate API methods to internal client with tenant headers
   */
  async get<T = unknown>(endpoint: string, options: RequestInit = {}) {
    return this.apiClient.request<T>(endpoint, {
      ...options,
      method: "GET",
      headers: { ...this.getTenantHeaders(), ...options.headers },
    });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ) {
    return this.apiClient.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...this.getTenantHeaders(),
        ...options.headers,
      },
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ) {
    return this.apiClient.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...this.getTenantHeaders(),
        ...options.headers,
      },
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ) {
    return this.apiClient.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...this.getTenantHeaders(),
        ...options.headers,
      },
    });
  }

  async delete<T = unknown>(endpoint: string, options: RequestInit = {}) {
    return this.apiClient.request<T>(endpoint, {
      ...options,
      method: "DELETE",
      headers: { ...this.getTenantHeaders(), ...options.headers },
    });
  }

  buildQueryString(params: Record<string, unknown>): string {
    return this.apiClient.buildQueryString(params);
  }

  /**
   * Helper to build query params with optional tenant filtering
   */
  buildTenantQueryParams(
    additionalParams: Record<string, unknown> = {}
  ): string {
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
  async getTenantScoped<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const queryString = this.buildTenantQueryParams(params);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.get<T>(url);
  }

  /**
   * Create a resource with automatic tenant context
   */
  async postTenantScoped<T>(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<T> {
    // Add subAccountId to the data if in tenant scope
    const enhancedData = { ...data };
    if (this.tenantContext?.subAccountId && !enhancedData.subAccountId) {
      enhancedData.subAccountId = this.tenantContext.subAccountId;
    }

    return this.post<T>(endpoint, enhancedData);
  }
}

/**
 * Create singleton instance
 */
export const tenantApiClient = TenantAwareApiClient.getInstance();

/**
 * Hook to get API client with tenant context automatically applied
 * Must be used within TenantProvider
 */
export function useTenantApiClient() {
  // This will be used in a React hook, so we can't import useTenant directly
  // Instead, components should call setTenantContext when they mount
  return tenantApiClient;
}
