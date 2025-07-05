'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AuthCookies } from '@/lib/cookies';
import type { AdminProfile, AdminLoginDto, AdminRegisterDto, AdminAuthResponse } from '@/lib/api';

interface AdminAuthContextType {
  admin: AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  adminLogin: (credentials: AdminLoginDto) => Promise<void>;
  adminRegister: (data: AdminRegisterDto) => Promise<void>;
  adminLogout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!admin;

  // Check for existing admin tokens and auto-login on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      console.log('🔍 Checking admin authentication...');
      try {
        // Check if we have any admin auth tokens
        if (AuthCookies.hasAdminTokens()) {
          console.log('✅ Found admin tokens, attempting to get profile...');
          // Try to get admin profile with timeout
          const profilePromise = api.adminAuth.getAdminProfile();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );
          
          const profile = await Promise.race([profilePromise, timeoutPromise]) as AdminProfile;
          console.log('✅ Admin profile retrieved successfully:', profile.email);
          setAdmin(profile);
        } else {
          console.log('❌ No admin tokens found');
        }
      } catch (error) {
        // Clear invalid tokens
        AuthCookies.clearAll();
        console.error('❌ Admin auto-login failed:', error);
      } finally {
        console.log('🏁 Admin auth check completed');
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  const adminLogin = async (credentials: AdminLoginDto) => {
    const response: AdminAuthResponse = await api.adminAuth.adminLogin(credentials);
    
    // Store admin tokens in cookies
    AuthCookies.setAdminAccessToken(response.access_token);
    AuthCookies.setAdminRefreshToken(response.refresh_token);
    
    // Get full admin profile and set admin
    const profile = await api.adminAuth.getAdminProfile();
    setAdmin(profile);
  };

  const adminRegister = async (data: AdminRegisterDto) => {
    await api.adminAuth.adminRegister(data);
  };

  const adminLogout = async () => {
    try {
      await api.adminAuth.adminLogout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Admin logout API call failed:', error);
    }
    
    // Clear tokens and admin state
    AuthCookies.clearAll();
    setAdmin(null);
  };

  const refreshAdmin = async () => {
    try {
      const profile = await api.adminAuth.getAdminProfile();
      setAdmin(profile);
    } catch (error) {
      // If getting profile fails, admin might be logged out
      setAdmin(null);
      AuthCookies.clearAll();
    }
  };

  const value: AdminAuthContextType = {
    admin,
    isLoading,
    isAuthenticated,
    adminLogin,
    adminRegister,
    adminLogout,
    refreshAdmin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
} 