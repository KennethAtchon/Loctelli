'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AuthCookies } from '@/lib/cookies';
import type { UserProfile, AdminProfile, LoginDto, AdminLoginDto, RegisterDto, AdminRegisterDto, AuthResponse, AdminAuthResponse } from '@/lib/api';
import logger from '@/lib/logger';

type AccountType = 'user' | 'admin';

interface UnifiedAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  // User-specific fields
  company?: string;
  budget?: string;
  subAccountId?: number;
  // Admin-specific fields
  permissions?: Record<string, unknown>;
}

interface UnifiedAuthContextType {
  // Account info
  account: UnifiedAccount | null;
  accountType: AccountType | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // User methods
  loginUser: (credentials: LoginDto) => Promise<void>;
  registerUser: (data: RegisterDto) => Promise<void>;

  // Admin methods
  loginAdmin: (credentials: AdminLoginDto) => Promise<void>;
  registerAdmin: (data: AdminRegisterDto) => Promise<void>;

  // Unified methods
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;

  // Type guards
  isUser: () => boolean;
  isAdmin: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<UnifiedAccount | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);

  const isAuthenticated = !!account && !!accountType;

  // Check for existing tokens and auto-login on mount
  useEffect(() => {
    if (authCheckInProgress) {
      logger.debug('🔄 Auth check already in progress, skipping...');
      return;
    }

    const checkAuth = async () => {
      setAuthCheckInProgress(true);
      logger.debug('🔍 Checking unified authentication...');

      const timeoutId = setTimeout(() => {
        logger.warn('⚠️ Unified auth check timeout - forcing loading to false');
        setIsLoading(false);
        setAuthCheckInProgress(false);
      }, 10000);

      try {
        // Check admin tokens first (admin takes precedence)
        if (AuthCookies.hasAdminTokens()) {
          logger.debug('✅ Found admin tokens, attempting to get profile...');
          try {
            const profile = await api.adminAuth.getAdminProfile();
            logger.debug('✅ Admin profile retrieved successfully:', profile.email);
            setAccount(normalizeAdminProfile(profile));
            setAccountType('admin');
          } catch (error) {
            logger.error('❌ Admin profile request failed:', error);
            if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
              logger.debug('🔒 Auth error detected, clearing admin tokens');
              AuthCookies.clearAdminTokens();
            }
          }
        }
        // Check user tokens if no admin session
        else if (AuthCookies.hasUserTokens()) {
          logger.debug('✅ Found user tokens, attempting to get profile...');
          try {
            const profile = await api.auth.getProfile();
            logger.debug('✅ User profile retrieved successfully:', profile.email);
            setAccount(normalizeUserProfile(profile));
            setAccountType('user');
          } catch (error) {
            logger.error('❌ User profile request failed:', error);
            if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
              logger.debug('🔒 Auth error detected, clearing user tokens');
              AuthCookies.clearUserTokens();
            }
          }
        } else {
          logger.debug('❌ No tokens found');
        }
      } catch (error) {
        logger.error('❌ Unified auth check failed:', error);
      } finally {
        clearTimeout(timeoutId);
        logger.debug('🏁 Unified auth check completed');
        setIsLoading(false);
        setAuthCheckInProgress(false);
      }
    };

    checkAuth();
  }, []);

  const loginUser = async (credentials: LoginDto) => {
    try {
      const response: AuthResponse = await api.auth.login(credentials);

      // Store tokens in cookies
      AuthCookies.setAccessToken(response.access_token);
      AuthCookies.setRefreshToken(response.refresh_token);

      // Create normalized account object
      const userProfile: UserProfile = {
        ...response.user,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAccount(normalizeUserProfile(userProfile));
      setAccountType('user');
      logger.log('✅ User login successful:', response.user.email);
    } catch (error) {
      logger.error('❌ User login failed:', error);
      throw error;
    }
  };

  const registerUser = async (data: RegisterDto) => {
    try {
      await api.auth.register(data);

      // Automatically log in with the same credentials
      await loginUser({
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      logger.error('❌ User registration failed:', error);
      throw error;
    }
  };

  const loginAdmin = async (credentials: AdminLoginDto) => {
    try {
      const response: AdminAuthResponse = await api.adminAuth.adminLogin(credentials);

      // Store admin tokens in cookies
      AuthCookies.setAdminAccessToken(response.access_token);
      AuthCookies.setAdminRefreshToken(response.refresh_token);

      setAccount(normalizeAdminProfile(response.admin));
      setAccountType('admin');
      logger.log('✅ Admin login successful:', response.admin.email);
    } catch (error) {
      logger.error('❌ Admin login failed:', error);
      throw error;
    }
  };

  const registerAdmin = async (data: AdminRegisterDto) => {
    try {
      await api.adminAuth.adminRegister(data);

      // Automatically log in with the same credentials
      await loginAdmin({
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      logger.error('❌ Admin registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (accountType === 'admin') {
        await api.adminAuth.adminLogout();
        AuthCookies.clearAdminTokens();
      } else if (accountType === 'user') {
        await api.auth.logout();
        AuthCookies.clearUserTokens();
      }
    } catch (error) {
      logger.error('❌ Logout API call failed:', error);
    }

    // Clear state
    setAccount(null);
    setAccountType(null);
    logger.log('✅ Logout successful');
  };

  const refreshAccount = async () => {
    try {
      if (accountType === 'admin') {
        const profile = await api.adminAuth.getAdminProfile();
        setAccount(normalizeAdminProfile(profile));
      } else if (accountType === 'user') {
        const profile = await api.auth.getProfile();
        setAccount(normalizeUserProfile(profile));
      }
    } catch (error) {
      logger.error('❌ Account refresh failed:', error);
      setAccount(null);
      setAccountType(null);
      AuthCookies.clearAll();
    }
  };

  const isUser = () => accountType === 'user';
  const isAdmin = () => accountType === 'admin';

  const value: UnifiedAuthContextType = {
    account,
    accountType,
    isLoading,
    isAuthenticated,
    loginUser,
    registerUser,
    loginAdmin,
    registerAdmin,
    logout,
    refreshAccount,
    isUser,
    isAdmin,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
}

// Helper functions to normalize profile data
function normalizeUserProfile(profile: UserProfile): UnifiedAccount {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    isActive: profile.isActive,
    lastLoginAt: profile.lastLoginAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    company: profile.company,
    budget: profile.budget,
    subAccountId: profile.subAccountId,
  };
}

function normalizeAdminProfile(profile: AdminProfile): UnifiedAccount {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    isActive: profile.isActive,
    lastLoginAt: profile.lastLoginAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    permissions: profile.permissions,
  };
}

// Backward compatibility hooks
export function useAuth() {
  const context = useUnifiedAuth();

  return {
    user: context.isUser() ? context.account as UserProfile : null,
    isLoading: context.isLoading,
    isAuthenticated: context.isAuthenticated && context.isUser(),
    login: context.loginUser,
    register: context.registerUser,
    logout: context.logout,
    refreshUser: context.refreshAccount,
  };
}

export function useAdminAuth() {
  const context = useUnifiedAuth();

  return {
    admin: context.isAdmin() ? context.account as AdminProfile : null,
    isLoading: context.isLoading,
    isAuthenticated: context.isAuthenticated && context.isAdmin(),
    adminLogin: context.loginAdmin,
    adminRegister: context.registerAdmin,
    adminLogout: context.logout,
    refreshAdmin: context.refreshAccount,
  };
}
