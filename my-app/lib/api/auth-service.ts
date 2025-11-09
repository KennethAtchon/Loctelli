import { AuthCookies } from '../cookies';
import logger from '@/lib/logger';
import { API_CONFIG } from '../utils/envUtils';

export interface AuthHeaders {
  [key: string]: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

export class AuthService {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  private isRefreshRequest = false;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Check if an endpoint is an authentication endpoint that should not be retried
  isAuthEndpoint(endpoint: string): boolean {
    const authEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout',
      '/auth/profile',
      '/auth/change-password'
    ];
    return authEndpoints.includes(endpoint);
  }

  // Get authentication headers based on available tokens
  getAuthHeaders(): AuthHeaders {
    const headers: AuthHeaders = {};
    
    // Debug: Check all tokens
    const adminAccessToken = AuthCookies.getAdminAccessToken();
    const adminRefreshToken = AuthCookies.getAdminRefreshToken();
    const userAccessToken = AuthCookies.getAccessToken();
    const userRefreshToken = AuthCookies.getRefreshToken();
    
    logger.debug('🔍 Token Debug:', {
      adminAccess: !!adminAccessToken,
      adminRefresh: !!adminRefreshToken,
      userAccess: !!userAccessToken,
      userRefresh: !!userRefreshToken,
      adminAccessLength: adminAccessToken?.length || 0,
      adminRefreshLength: adminRefreshToken?.length || 0,
    });
    
    // Check for admin tokens first (admin takes precedence)
    if (adminAccessToken) {
      headers['x-user-token'] = adminAccessToken;
      logger.debug('🔑 Admin access token found and added to headers');
      return headers;
    }
    
    // Check for regular user tokens
    if (userAccessToken) {
      headers['x-user-token'] = userAccessToken;
      logger.debug('🔑 User access token found and added to headers');
    } else {
      logger.debug('ℹ️ No access tokens found');
    }
    
    return headers;
  }

  // Refresh tokens automatically
  async refreshTokens(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      // If already refreshing, wait for the existing promise
      await this.refreshPromise;
      return;
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
        try {
          logger.debug('🔄 Attempting admin token refresh...');
          // Use direct fetch to avoid infinite loop - now using unified endpoint
          this.isRefreshRequest = true;
          const response = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: adminRefreshToken }),
          });
          this.isRefreshRequest = false;

          if (!response.ok) {
            const errorText = await response.text();
            logger.debug(`❌ Admin refresh failed with status ${response.status}:`, errorText);
            throw new Error(`Refresh failed: ${response.status} - ${errorText}`);
          }

          const data: TokenRefreshResponse = await response.json();
          logger.debug('✅ Admin token refresh successful, updating cookies...');
          AuthCookies.setAdminAccessToken(data.access_token);
          AuthCookies.setAdminRefreshToken(data.refresh_token);
          logger.debug('✅ Admin tokens updated successfully');
          return;
        } catch (error) {
          logger.debug('❌ Admin token refresh failed:', error);
          // Clear only admin tokens on failure
          AuthCookies.clearAdminTokens();
          throw error;
        }
      }

      // Try regular user refresh
      const refreshToken = AuthCookies.getRefreshToken();
      if (refreshToken) {
        try {
          logger.debug('🔄 Attempting user token refresh...');
          // Use direct fetch to avoid infinite loop
          this.isRefreshRequest = true;
          const response = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          this.isRefreshRequest = false;

          if (!response.ok) {
            const errorText = await response.text();
            logger.debug(`❌ User refresh failed with status ${response.status}:`, errorText);
            throw new Error(`Refresh failed: ${response.status} - ${errorText}`);
          }

          const data: TokenRefreshResponse = await response.json();
          logger.debug('✅ User token refresh successful, updating cookies...');
          AuthCookies.setAccessToken(data.access_token);
          AuthCookies.setRefreshToken(data.refresh_token);
          logger.debug('✅ User tokens updated successfully');
          return;
        } catch (error) {
          logger.debug('❌ User token refresh failed:', error);
          // Clear only user tokens on failure
          AuthCookies.clearUserTokens();
          throw error;
        }
      }

      // This is expected for initial login attempts - don't treat as error
      logger.debug('⚠️ No refresh tokens available for refresh');
      throw new Error('No refresh tokens available');
    } catch (error) {
      // Only log as error if it's not the expected "no refresh tokens" case
      if (error instanceof Error && error.message === 'No refresh tokens available') {
        logger.debug('❌ Token refresh failed completely:', error.message);
      } else {
        logger.error('❌ Token refresh failed completely:', error);
      }
      throw error;
    }
  }

  // Handle 401 responses by attempting token refresh
  async handleUnauthorized(endpoint: string): Promise<AuthHeaders> {
    if (this.isRefreshRequest || this.isAuthEndpoint(endpoint)) {
      throw new Error('Authentication failed. Please log in again.');
    }

    logger.debug('🔒 401 Unauthorized, attempting token refresh...');
    try {
      await this.refreshTokens();
      
      // Return new auth headers after refresh
      const newAuthHeaders = this.getAuthHeaders();
      logger.debug('🔄 Retrying with new auth headers:', newAuthHeaders);
      return newAuthHeaders;
    } catch (refreshError) {
      logger.debug('❌ Token refresh failed:', refreshError);
      throw new Error('Authentication failed. Please log in again.');
    }
  }

  // Check if currently in a refresh request
  isInRefreshRequest(): boolean {
    return this.isRefreshRequest;
  }

  // Clear all authentication tokens
  clearAllTokens(): void {
    AuthCookies.clearAll();
  }

  // Clear only admin tokens
  clearAdminTokens(): void {
    AuthCookies.clearAdminTokens();
  }

  // Clear only user tokens
  clearUserTokens(): void {
    AuthCookies.clearUserTokens();
  }

  // Check if user has any tokens
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