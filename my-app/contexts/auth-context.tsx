'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AuthCookies } from '@/lib/cookies';
import type { UserProfile, LoginDto, RegisterDto, AuthResponse } from '@/lib/api';

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

  const isAuthenticated = !!user;

  // Check for existing tokens and auto-login on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking user authentication...');
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ User auth check timeout - forcing loading to false');
        setIsLoading(false);
      }, 10000); // 10 second timeout

      try {
        // Check if we have any auth tokens
        if (AuthCookies.hasUserTokens()) {
          console.log('✅ Found user tokens, attempting to get profile...');
          // Try to get user profile with timeout
          const profilePromise = api.auth.getProfile();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );
          
          const profile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile;
          console.log('✅ User profile retrieved successfully:', profile.email);
          setUser(profile);
        } else {
          console.log('❌ No user tokens found');
        }
      } catch (error) {
        // Clear invalid tokens
        AuthCookies.clearAll();
        console.error('❌ Auto-login failed:', error);
      } finally {
        clearTimeout(timeoutId);
        console.log('🏁 User auth check completed');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginDto) => {
    const response: AuthResponse = await api.auth.login(credentials);
    
    // Store tokens in cookies
    AuthCookies.setAccessToken(response.access_token);
    AuthCookies.setRefreshToken(response.refresh_token);
    
    // Get full user profile and set user
    const profile = await api.auth.getProfile();
    setUser(profile);
  };

  const register = async (data: RegisterDto) => {
    await api.auth.register(data);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
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