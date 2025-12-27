import { API_CONFIG } from "../utils/envUtils";
import logger from "@/lib/logger";
import { rateLimiter } from "../utils/rate-limiter";
import { AuthManager } from "./auth-manager";
import { toast } from "sonner";

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
    // Skip rate limit check for public endpoints (they're public and shouldn't be blocked client-side)
    const isPublicEndpoint = endpoint.includes("/forms/public/") || 
                             endpoint.includes("/auth/") ||
                             endpoint.includes("/status/");
    
    if (!isPublicEndpoint) {
      rateLimiter.checkRateLimit(endpoint);
    }

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
      // Check if response is HTML (likely a Next.js error page)
      const contentType = response.headers.get("content-type") || "";
      const isHtml = contentType.includes("text/html");
      
      if (isHtml) {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        const htmlText = await clonedResponse.text();
        
        // Check if it's a Next.js 404 page
        if (htmlText.includes("404") || htmlText.includes("This page could not be found")) {
          logger.error("❌ Received 404 HTML page - route not found:", {
            url,
            endpoint,
            method,
            status: response.status,
          });
          throw new Error(
            `Route not found: ${endpoint}. The API proxy route may not be configured correctly or the endpoint doesn't exist.`
          );
        }
        
        // Generic HTML error response
        logger.error("❌ Received HTML error response:", {
          url,
          endpoint,
          method,
          status: response.status,
          contentType,
        });
        throw new Error(
          `Server returned HTML instead of JSON (status ${response.status}). This usually means the route doesn't exist or there's a routing issue.`
        );
      }

      // Handle rate limiting
      if (response.status === 429) {
        const errorData = await this.parseError(response);
        const retryAfter =
          typeof errorData.retryAfter === "number" ? errorData.retryAfter : 60;
        
        // Only block client-side for non-public endpoints
        // Public endpoints should rely on backend rate limiting only
        const isPublicEndpoint = endpoint.includes("/forms/public/") || 
                                 endpoint.includes("/auth/") ||
                                 endpoint.includes("/status/");
        
        if (!isPublicEndpoint) {
          rateLimiter.handleRateLimitError(endpoint, response, { retryAfter });
        } else {
          // For public endpoints, just show the error without blocking future requests
          logger.warn(
            `🚫 Rate limit exceeded for public endpoint ${endpoint}. Retry after ${retryAfter} seconds`
          );
          // Show toast notification but don't block the endpoint
          const waitTime = rateLimiter.formatTime(retryAfter);
          if (typeof window !== "undefined") {
            toast.error(`Rate limited! Please wait ${waitTime} before trying again.`);
          }
        }
      }

      const error = await this.parseError(response);
      throw new Error(error.message || response.statusText);
    }

    // Get content type to determine how to handle the response
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    // Handle empty responses
    let text: string;
    try {
      text = await response.text();
    } catch (readError) {
      logger.error("❌ Failed to read response body:", {
        endpoint,
        error:
          readError instanceof Error ? readError.message : String(readError),
        status: response.status,
        contentType,
      });
      throw new Error(
        `Failed to read response body: ${
          readError instanceof Error ? readError.message : "Unknown error"
        }`
      );
    }

    // Log response for debugging
    logger.debug("📥 Response received:", {
      endpoint,
      status: response.status,
      contentType,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 200),
    });

    // Handle empty responses
    if (!text || !text.trim()) {
      logger.debug("⚠️ Empty response body, returning empty object");
      return {} as T;
    }

    // If content type indicates JSON, parse it
    if (isJson) {
      try {
        const parsed = JSON.parse(text) as T;
        logger.debug("✅ Successfully parsed JSON response");
        return parsed;
      } catch (parseError) {
        logger.error("❌ Failed to parse JSON response:", {
          endpoint,
          error:
            parseError instanceof Error ? parseError.message : String(parseError),
          contentType,
          preview: text.substring(0, 200),
          fullText: text.length < 1000 ? text : `${text.substring(0, 1000)}...`,
        });
        throw new Error(
          `Invalid JSON response from server: ${
            parseError instanceof Error ? parseError.message : "Parse error"
          }`
        );
      }
    }

    // If not JSON, return as text (cast to T)
    logger.debug("⚠️ Non-JSON response, returning as text");
    return text as unknown as T;
  }

  private async parseError(
    response: Response
  ): Promise<{ message: string; retryAfter?: number }> {
    try {
      // Clone the response to avoid consuming the body if it's already been read
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          // NestJS error responses can have message at root level or nested
          const message = 
            data.message || 
            data.error?.message || 
            data.error || 
            data.statusMessage ||
            response.statusText;
          return {
            message: message || response.statusText,
            retryAfter: data.retryAfter,
          };
        } catch (parseError) {
          // If JSON parsing fails, return the text as the message
          logger.debug("Failed to parse error response as JSON, using raw text:", text);
          return { message: text || response.statusText };
        }
      }
    } catch (error) {
      logger.error("Failed to read error response:", error);
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
