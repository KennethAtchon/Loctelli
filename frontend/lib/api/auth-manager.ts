import { AuthCookies } from "@/lib/cookies";
import logger from "@/lib/logger";
import { API_CONFIG } from "../utils/envUtils";

export interface AuthHeaders {
  [key: string]: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

let defaultAuthManager: AuthManager | null = null;

export class AuthManager {
  private baseUrl: string;
  private static refreshPromise: Promise<void> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private static readonly PREEMPTIVE_REFRESH_RATIO = 0.8;

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
    // Avoid concurrent refresh attempts (they can invalidate each other when
    // refresh tokens rotate, causing accidental logout during active sessions)
    if (AuthManager.refreshPromise) {
      logger.debug("🔄 Token refresh already in progress, waiting for it...");
      return AuthManager.refreshPromise;
    }

    AuthManager.refreshPromise = this.performRefreshToken().finally(() => {
      AuthManager.refreshPromise = null;
    });

    return AuthManager.refreshPromise;
  }

  private async performRefreshToken(): Promise<void> {
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
        this.schedulePreemptiveRefresh();
        return;
      } catch (error) {
        logger.error("❌ Admin token refresh failed:", error);
        AuthCookies.clearAdminTokens();
        this.clearRefreshTimer();
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
        this.schedulePreemptiveRefresh();
        return;
      } catch (error) {
        logger.error("❌ User token refresh failed:", error);
        AuthCookies.clearUserTokens();
        this.clearRefreshTimer();
        throw error;
      }
    }

    throw new Error("No refresh token available");
  }

  private schedulePreemptiveRefresh(): void {
    this.clearRefreshTimer();

    const token = AuthCookies.getAccessToken() || AuthCookies.getAdminAccessToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const ttl = exp - now;

      if (ttl <= 0) {
        logger.debug("🕒 Token already expired, skipping preemptive refresh");
        return;
      }

      const refreshAt = now + ttl * AuthManager.PREEMPTIVE_REFRESH_RATIO;
      const delay = Math.max(refreshAt - now, 1000); // At least 1 second

      logger.debug(
        `⏰ Scheduling preemptive refresh in ${Math.round(delay / 1000)}s (TTL: ${Math.round(ttl / 1000)}s)`
      );

      this.refreshTimer = setTimeout(async () => {
        try {
          logger.debug("🔄 Performing preemptive token refresh...");
          await this.refreshToken();
        } catch (error) {
          logger.error("❌ Preemptive refresh failed:", error);
          // Let the existing 401 flow handle session expiration
        }
      }, delay);
    } catch (error) {
      logger.error("❌ Failed to parse JWT for preemptive refresh:", error);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /** Call this after successful login to start preemptive refresh scheduling */
  startPreemptiveRefresh(): void {
    this.schedulePreemptiveRefresh();
  }

  /** Call this on logout to clear timers */
  clearTimers(): void {
    this.clearRefreshTimer();
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
    this.startPreemptiveRefresh();
  }

  // Clear all tokens
  clearTokens(): void {
    AuthCookies.clearAll();
    this.clearTimers();
  }

  // Clear admin tokens
  clearAdminTokens(): void {
    AuthCookies.clearAdminTokens();
    this.clearTimers();
  }

  // Clear user tokens
  clearUserTokens(): void {
    AuthCookies.clearUserTokens();
    this.clearTimers();
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

export function getAuthManager(baseUrl: string = API_CONFIG.BASE_URL): AuthManager {
  if (baseUrl === API_CONFIG.BASE_URL) {
    if (!defaultAuthManager) {
      defaultAuthManager = new AuthManager(baseUrl);
    }
    return defaultAuthManager;
  }

  return new AuthManager(baseUrl);
}

export const authManager = getAuthManager();
