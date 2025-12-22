import { AuthCookies } from "../cookies";
import logger from "@/lib/logger";
import { API_CONFIG } from "../utils/envUtils";

export interface AuthHeaders {
  [key: string]: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

export class AuthManager {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Check if an endpoint is an authentication endpoint
  isAuthEndpoint(endpoint: string): boolean {
    return endpoint.startsWith("/auth/");
  }

  // Get authentication headers using Authorization Bearer format
  getAuthHeaders(): AuthHeaders {
    const adminToken = AuthCookies.getAdminAccessToken();
    const userToken = AuthCookies.getAccessToken();

    // Admin takes precedence
    if (adminToken) {
      return { Authorization: `Bearer ${adminToken}` };
    }

    if (userToken) {
      return { Authorization: `Bearer ${userToken}` };
    }

    return {};
  }

  // Refresh tokens
  async refreshToken(): Promise<void> {
    const adminRefresh = AuthCookies.getAdminRefreshToken();
    const userRefresh = AuthCookies.getRefreshToken();

    if (adminRefresh) {
      try {
        logger.debug("🔄 Attempting admin token refresh...");
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: adminRefresh }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.debug(
            `❌ Admin refresh failed: ${response.status} - ${errorText}`
          );
          AuthCookies.clearAdminTokens();
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data: TokenRefreshResponse = await response.json();
        AuthCookies.setAdminAccessToken(data.access_token);
        AuthCookies.setAdminRefreshToken(data.refresh_token);
        logger.debug("✅ Admin token refresh successful");
        return;
      } catch (error) {
        logger.error("❌ Admin token refresh failed:", error);
        AuthCookies.clearAdminTokens();
        throw error;
      }
    }

    if (userRefresh) {
      try {
        logger.debug("🔄 Attempting user token refresh...");
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: userRefresh }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.debug(
            `❌ User refresh failed: ${response.status} - ${errorText}`
          );
          AuthCookies.clearUserTokens();
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data: TokenRefreshResponse = await response.json();
        AuthCookies.setAccessToken(data.access_token);
        AuthCookies.setRefreshToken(data.refresh_token);
        logger.debug("✅ User token refresh successful");
        return;
      } catch (error) {
        logger.error("❌ User token refresh failed:", error);
        AuthCookies.clearUserTokens();
        throw error;
      }
    }

    throw new Error("No refresh tokens available");
  }

  // Set tokens after login
  setTokens(accessToken: string, refreshToken: string, isAdmin = false): void {
    if (isAdmin) {
      AuthCookies.setAdminAccessToken(accessToken);
      AuthCookies.setAdminRefreshToken(refreshToken);
    } else {
      AuthCookies.setAccessToken(accessToken);
      AuthCookies.setRefreshToken(refreshToken);
    }
  }

  // Clear all tokens
  clearTokens(): void {
    AuthCookies.clearAll();
  }

  // Clear admin tokens
  clearAdminTokens(): void {
    AuthCookies.clearAdminTokens();
  }

  // Clear user tokens
  clearUserTokens(): void {
    AuthCookies.clearUserTokens();
  }

  // Check if user has tokens
  hasTokens(): boolean {
    return AuthCookies.hasUserTokens() || AuthCookies.hasAdminTokens();
  }

  // Check if admin has tokens
  hasAdminTokens(): boolean {
    return AuthCookies.hasAdminTokens();
  }

  // Check if user has tokens
  hasUserTokens(): boolean {
    return AuthCookies.hasUserTokens();
  }
}
