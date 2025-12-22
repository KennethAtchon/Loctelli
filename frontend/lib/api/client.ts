import { API_CONFIG } from "../utils/envUtils";
import logger from "@/lib/logger";
import { rateLimiter } from "../utils/rate-limiter";
import { AuthManager } from "./auth-manager";

const API_BASE_URL = API_CONFIG.BASE_URL;

export class ApiClient {
  private baseUrl: string;
  private authManager: AuthManager;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.authManager = new AuthManager(baseUrl);

    // Clean up expired rate limit blocks every minute
    setInterval(() => {
      rateLimiter.cleanup();
    }, 60000);
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || "GET";
    const isAuthEndpoint = this.authManager.isAuthEndpoint(endpoint);

    logger.debug("🌐 API Request:", {
      url,
      method,
      endpoint,
    });

    // Check if endpoint is currently rate limited
    rateLimiter.checkRateLimit(endpoint);

    // Add auth headers
    const authHeaders = this.authManager.getAuthHeaders();
    logger.debug("🔑 Auth headers:", authHeaders);

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    };

    // Remove Content-Type for FormData (browser will set it with boundary)
    if (options.body instanceof FormData) {
      delete (headers as Record<string, string>)["Content-Type"];
    }

    // Make request
    let response = await fetch(url, {
      ...options,
      headers,
    });

    logger.debug("📡 Response status:", response.status, response.statusText);

    // Handle 401 Unauthorized - attempt token refresh and retry once
    if (response.status === 401 && !isAuthEndpoint) {
      logger.debug("🔒 401 Unauthorized, attempting token refresh...");
      try {
        await this.authManager.refreshToken();

        // Retry request with new token
        const newAuthHeaders = this.authManager.getAuthHeaders();
        const retryHeaders: HeadersInit = {
          ...headers,
          ...newAuthHeaders,
        };

        if (options.body instanceof FormData) {
          delete retryHeaders["Content-Type"];
        }

        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        logger.debug(
          "🔄 Retry response status:",
          response.status,
          response.statusText
        );

        // If retry still fails, clear tokens and throw
        if (response.status === 401) {
          this.authManager.clearTokens();
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            if (currentPath.startsWith("/admin")) {
              window.location.href = "/admin/login";
            } else {
              window.location.href = "/auth/login";
            }
          }
          throw new Error("Authentication failed. Please log in again.");
        }
      } catch (refreshError) {
        logger.error("❌ Token refresh failed:", refreshError);
        this.authManager.clearTokens();
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath.startsWith("/admin")) {
            window.location.href = "/admin/login";
          } else {
            window.location.href = "/auth/login";
          }
        }
        throw new Error("Authentication failed. Please log in again.");
      }
    }

    // Handle errors
    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        const errorData = await this.parseError(response);
        const retryAfter =
          typeof errorData.retryAfter === "number" ? errorData.retryAfter : 60;
        rateLimiter.handleRateLimitError(endpoint, response, { retryAfter });
      }

      const error = await this.parseError(response);
      throw new Error(error.message || response.statusText);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text || !text.trim()) {
      return {} as T;
    }

    // Parse JSON
    try {
      return JSON.parse(text) as T;
    } catch (parseError) {
      logger.error("❌ Failed to parse JSON response:", {
        endpoint,
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
        preview: text.substring(0, 200),
      });
      throw new Error("Invalid JSON response from server");
    }
  }

  private async parseError(
    response: Response
  ): Promise<{ message: string; retryAfter?: number }> {
    try {
      const text = await response.text();
      if (text) {
        const data = JSON.parse(text);
        return {
          message: data.message || data.error || response.statusText,
          retryAfter: data.retryAfter,
        };
      }
    } catch {
      // Ignore parse errors
    }
    return { message: response.statusText };
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    logger.debug("📤 POST Request:", {
      endpoint,
      data: data ? JSON.stringify(data, null, 2) : "No data",
    });

    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
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
