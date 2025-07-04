'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
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

  // Check for existing tokens on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
          // Try to get user profile
          const profile = await api.auth.getProfile();
          setUser(profile);
        }
      } catch (error) {
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginDto) => {
    const response: AuthResponse = await api.auth.login(credentials);
    
    // Store tokens
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    // Set user
    setUser(response.user);
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await api.auth.getProfile();
      setUser(profile);
    } catch (error) {
      // If getting profile fails, user might be logged out
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
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