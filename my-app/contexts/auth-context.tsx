'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AuthCookies } from '@/lib/cookies';
import type { UserProfile, LoginDto, RegisterDto, AuthResponse } from '@/lib/api';
import logger from '@/lib/logger';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);

  const isAuthenticated = !!user;

  // Check for existing tokens and auto-login on mount
  useEffect(() => {
    // Prevent multiple simultaneous auth checks during hot reloads
    if (authCheckInProgress) {
      logger.debug('🔄 Auth check already in progress, skipping...');
      return;
    }

    const checkAuth = async () => {
      setAuthCheckInProgress(true);
      logger.debug('🔍 Checking user authentication...');
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        logger.warn('⚠️ User auth check timeout - forcing loading to false');
        setIsLoading(false);
        setAuthCheckInProgress(false);
      }, 10000); // 10 second timeout

      try {
        // Check if we have any auth tokens
        if (AuthCookies.hasUserTokens()) {
          logger.debug('✅ Found user tokens, attempting to get profile...');
          // Try to get user profile with timeout
          const profilePromise = api.auth.getProfile();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );
          
          const profile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile;
          logger.debug('✅ User profile retrieved successfully:', profile.email);
          setUser(profile);
        } else {
          logger.debug('❌ No user tokens found');
        }
      } catch (error) {
        logger.error('❌ Auto-login failed:', error);
        
        // Only clear tokens if the error is specifically auth-related
        if (error instanceof Error) {
          if (error.message.includes('401') || 
              error.message.includes('Unauthorized') || 
              error.message.includes('Authentication failed') ||
              error.message.includes('Invalid token')) {
            logger.debug('🔒 Auth error detected, clearing user tokens');
            AuthCookies.clearUserTokens();
          } else if (error.message.includes('Failed to fetch') || 
                    error.message.includes('NetworkError') ||
                    error.message.includes('timeout') ||
                    error.message.includes('Request timeout')) {
            logger.debug('🌐 Network error detected, keeping tokens for retry');
            // Don't clear tokens for network errors - they might be temporary
          } else {
            logger.debug('❓ Unknown error type, keeping tokens for safety');
            // Don't clear tokens for unknown errors
          }
        }
      } finally {
        clearTimeout(timeoutId);
        logger.debug('🏁 User auth check completed');
        setIsLoading(false);
        setAuthCheckInProgress(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginDto) => {
    try {
      const response: AuthResponse = await api.auth.login(credentials);
      
      // Store tokens in cookies
      AuthCookies.setAccessToken(response.access_token);
      AuthCookies.setRefreshToken(response.refresh_token);
      
      // Create a proper UserProfile object from the login response
      const userProfile: UserProfile = {
        ...response.user,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUser(userProfile);
    } catch (error) {
      logger.error('Login failed:', error);
      // Re-throw the error so the form can handle it
      throw error;
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      // First register the user
      await api.auth.register(data);
      
      // Then automatically log them in with the same credentials
      const loginCredentials: LoginDto = {
        email: data.email,
        password: data.password,
      };
      
      // Use the existing login method to handle the login
      await login(loginCredentials);
    } catch (error) {
      logger.error('Registration failed:', error);
      // Re-throw the error so the form can handle it
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      logger.error('Logout API call failed:', error);
    }
    
    // Clear tokens and user state
    AuthCookies.clearAll();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await api.auth.getProfile();
      setUser(profile);
    } catch (error) {
      // If getting profile fails, user might be logged out
      setUser(null);
      AuthCookies.clearAll();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 