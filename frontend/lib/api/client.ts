import { ApiRequestOptions } from "./types";
import { API_CONFIG } from "../utils/envUtils";
import logger from "@/lib/logger";
import { rateLimiter } from "../utils/rate-limiter";
import { AuthService } from "./auth-service";

const API_BASE_URL = API_CONFIG.BASE_URL;

export class ApiClient {
  private baseUrl: string;
  private defaultOptions: ApiRequestOptions = {
    timeout: 10000,
    retries: 3,
  };
  private authService: AuthService;
  private failedRequests = new Map<string, number>();
  // Request deduplication: track in-flight requests to prevent duplicates
  private pendingRequests = new Map<string, Promise<unknown>>();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.authService = new AuthService(baseUrl);

    // Clean up expired blocks and failed requests every minute
    setInterval(() => {
      rateLimiter.cleanup();
      this.cleanupFailedRequests();
    }, 60000);
  }

  private cleanupFailedRequests(): void {
    // Clear failed requests after 5 minutes to allow retry
    // This prevents permanent blocking of endpoints
    const hadFailures = this.failedRequests.size > 0;
    this.failedRequests.clear();
    if (hadFailures) {
      logger.debug("🧹 Cleaned up failed requests cache");
    }
  }

  /**
   * Normalize endpoint for deduplication by sorting query parameters
   */
  private normalizeEndpointForDedup(endpoint: string): string {
    const [path, queryString] = endpoint.split("?");
    if (!queryString) return endpoint;

    // Parse and sort query parameters for consistent deduplication
    const params = new URLSearchParams(queryString);
    const sortedParams = Array.from(params.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const normalizedQuery = new URLSearchParams(sortedParams).toString();

    return normalizedQuery ? `${path}?${normalizedQuery}` : path;
  }

  protected async request<T = unknown>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const isAuthEndpoint = this.authService.isAuthEndpoint(endpoint);
    const method = options.method || "GET";

    // Create a unique key for request deduplication (only for GET requests)
    // Normalize endpoint to handle query parameter ordering differences
    const normalizedEndpoint =
      method === "GET" ? this.normalizeEndpointForDedup(endpoint) : endpoint;
    const requestKey =
      method === "GET" ? `${method}:${normalizedEndpoint}` : null;

    // Check if there's already an identical request in flight
    if (requestKey && this.pendingRequests.has(requestKey)) {
      logger.debug("🔄 Deduplicating request:", requestKey);
      const pendingRequest = this.pendingRequests.get(requestKey);
      if (pendingRequest) {
        return pendingRequest as Promise<T>;
      }
    }

    logger.debug("🌐 API Request:", {
      url,
      method,
      endpoint,
      isAuthEndpoint,
    });

    // Check for repeated failures to prevent infinite retries
    const failureKey = `${options.method || "GET"}:${endpoint}`;
    const failureCount = this.failedRequests.get(failureKey) || 0;
    const maxFailures = options.retries || this.defaultOptions.retries || 3;

    if (failureCount >= maxFailures) {
      logger.warn(`🚫 Request blocked due to repeated failures: ${failureKey}`);
      throw new Error(`Request failed too many times. Please try again later.`);
    }

    // Check if endpoint is currently rate limited
    rateLimiter.checkRateLimit(endpoint);

    // Add auth headers
    const authHeaders = this.authService.getAuthHeaders();
    logger.debug("🔑 Auth headers:", authHeaders);

    // Create the request promise and store it for deduplication
    const requestPromise = this.executeRequest<T>(
      endpoint,
      options,
      url,
      isAuthEndpoint,
      authHeaders,
      failureKey,
      failureCount
    );

    // Store the promise for GET requests to enable deduplication
    if (requestKey) {
      this.pendingRequests.set(requestKey, requestPromise);
      // Clean up after request completes (success or failure)
      requestPromise
        .finally(() => {
          this.pendingRequests.delete(requestKey);
        })
        .catch(() => {
          // Error already handled in executeRequest
        });
    }

    return requestPromise;
  }

  /**
   * Safely parse JSON response, handling empty responses and invalid JSON
   */
  private async safeJsonParse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    // Check if response has content
    const text = await response.text();
    
    // If empty response, return empty object or null based on context
    if (!text || !text.trim()) {
      if (isJson) {
        // Empty JSON response - return empty object
        return {} as T;
      }
      // Non-JSON empty response
      return null as T;
    }

    // Only try to parse if it's JSON or looks like JSON
    if (isJson || text.trim().startsWith("{") || text.trim().startsWith("[")) {
      try {
        return JSON.parse(text) as T;
      } catch (error) {
        logger.error("❌ Failed to parse JSON response:", {
          error,
          contentType,
          preview: text.substring(0, 200),
        });
        throw new Error(
          `Invalid JSON response: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // If not JSON, return as text (cast to T)
    return text as unknown as T;
  }

  private async executeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions,
    url: string,
    isAuthEndpoint: boolean,
    authHeaders: Record<string, string>,
    failureKey: string,
    failureCount: number
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        // Only set Content-Type if body is not FormData
        ...(!(options.body instanceof FormData) && {
          "Content-Type": "application/json",
        }),
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || this.defaultOptions.timeout
      );

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      logger.debug("📡 Response status:", response.status, response.statusText);

      // Handle 401 Unauthorized - but NOT for auth endpoints or refresh requests
      // Also skip if we're already rate limited to prevent cascading failures
      if (
        response.status === 401 &&
        !this.authService.isInRefreshRequest() &&
        !isAuthEndpoint &&
        !rateLimiter.isBlocked(endpoint)
      ) {
        logger.debug("🔒 401 Unauthorized, attempting token refresh...");
        try {
          const newAuthHeaders =
            await this.authService.handleUnauthorized(endpoint);

          // Retry the request with new tokens
          logger.debug("🔄 Retrying with new auth headers:", newAuthHeaders);
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

          logger.debug(
            "🔄 Retry response status:",
            retryResponse.status,
            retryResponse.statusText
          );

          if (!retryResponse.ok) {
            // If retry fails after refresh, redirect to login page
            logger.debug(
              "❌ Retry failed after token refresh, redirecting to login..."
            );

            // Clear all tokens since refresh failed
            this.authService.clearAllTokens();

            // Redirect to appropriate login page based on current path
            const currentPath = window.location.pathname;
            if (currentPath.startsWith("/admin")) {
              window.location.href = "/admin/login";
            } else {
              window.location.href = "/auth/login";
            }

            // Throw error to stop execution
            throw new Error(
              "Authentication failed. Redirecting to login page."
            );
          }

          // Handle blob responses in retry logic too
          if (options.responseType === "blob") {
            return (await retryResponse.blob()) as T;
          }

          return await this.safeJsonParse<T>(retryResponse);
        } catch (refreshError) {
          logger.debug("❌ Token refresh failed:", refreshError);
          // Don't automatically redirect - let the components handle this
          // This prevents page refreshes that lose error state
          throw new Error("Authentication failed. Please log in again.");
        }
      }

      if (!response.ok) {
        // Track failure for this request
        this.failedRequests.set(failureKey, failureCount + 1);

        // Safely parse error response
        let errorData: Record<string, unknown> = {};
        try {
          const parsed = await this.safeJsonParse<Record<string, unknown>>(response);
          errorData = parsed || {};
        } catch (parseError) {
          // If parsing fails, use empty object
          logger.debug("Could not parse error response:", parseError);
        }

        // Handle rate limiting specifically
        if (response.status === 429) {
          rateLimiter.handleRateLimitError(endpoint, response, {
            retryAfter: typeof errorData.retryAfter === "number" 
              ? errorData.retryAfter 
              : undefined,
          });
        }

        // For auth endpoints, use simpler error logging to avoid noise
        if (isAuthEndpoint) {
          logger.debug("❌ Auth endpoint failed:", {
            status: response.status,
            endpoint,
          });
        } else {
          logger.error("❌ API request failed:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
        }

        // Extract error message from different possible formats
        let errorMessage = response.statusText;
        if (typeof errorData.message === "string") {
          errorMessage = errorData.message;
        } else if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }

        throw new Error(errorMessage);
      }

      // Clear failure count on successful request
      this.failedRequests.delete(failureKey);

      // Handle blob responses (for file downloads)
      if (options.responseType === "blob") {
        return (await response.blob()) as T;
      }

      return await this.safeJsonParse<T>(response);
    } catch (error) {
      // Track failure for this request
      this.failedRequests.set(failureKey, failureCount + 1);

      // For auth endpoints, use simpler error logging to avoid noise
      if (isAuthEndpoint) {
        logger.debug("❌ Auth request failed:", error);
      } else {
        logger.error("❌ API request failed:", error);
      }

      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(
            "Request timeout. Please check your connection and try again."
          );
        }
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          throw new Error(
            "Network error. Please check your connection and try again."
          );
        }
        // Handle JSON parsing errors specifically
        if (
          error.message.includes("Decoding failed") ||
          error.message.includes("Invalid JSON") ||
          error.message.includes("JSON.parse")
        ) {
          logger.error("❌ JSON parsing error:", {
            endpoint,
            error: error.message,
          });
          throw new Error(
            "Invalid response from server. Please try again or contact support."
          );
        }
      }

      throw error;
    }
  }

  public async get<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", ...options });
  }

  public async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    logger.debug("📤 POST Request:", {
      endpoint,
      data: data ? JSON.stringify(data, null, 2) : "No data",
    });

    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  public async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  public async delete<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", ...options });
  }

  public async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  public async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options?: ApiRequestOptions
  ): Promise<T> {
    // Use the main request method but with special handling for FormData
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type - let browser handle FormData boundary
        // This will override the default 'application/json' in the main request method
        ...options?.headers,
      },
      ...options,
    });
  }

  // Helper method to build query strings
  public buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    return searchParams.toString();
  }
}

// Create and export a default instance for backward compatibility
export const apiClient = new ApiClient();
