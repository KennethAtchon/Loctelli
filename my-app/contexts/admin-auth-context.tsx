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
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Admin auth check timeout - forcing loading to false');
        setIsLoading(false);
      }, 10000); // 10 second timeout

      try {
        // Check if we have any admin auth tokens
        if (AuthCookies.hasAdminTokens()) {
          console.log('✅ Found admin tokens, attempting to get profile...');
          
          // Get the actual tokens for debugging
          const adminAccessToken = AuthCookies.getAdminAccessToken();
          const adminRefreshToken = AuthCookies.getAdminRefreshToken();
          console.log('🔑 Admin access token exists:', !!adminAccessToken);
          console.log('🔑 Admin refresh token exists:', !!adminRefreshToken);
          console.log('🔑 Admin access token length:', adminAccessToken?.length || 0);
          
          // Try to get admin profile with detailed error handling
          try {
            const profile = await api.adminAuth.getAdminProfile();
            console.log('✅ Admin profile retrieved successfully:', profile.email);
            setAdmin(profile);
          } catch (profileError) {
            console.error('❌ Admin profile request failed:', profileError);
            console.error('❌ Error details:', {
              message: profileError instanceof Error ? profileError.message : 'Unknown error',
              name: profileError instanceof Error ? profileError.name : 'Unknown',
            });
            
            // Check if it's a network error vs auth error
            if (profileError instanceof Error) {
              if (profileError.message.includes('Failed to fetch') || 
                  profileError.message.includes('NetworkError') ||
                  profileError.message.includes('timeout')) {
                console.log('🌐 Network error detected, keeping tokens for retry');
                // Don't clear tokens for network errors
              } else if (profileError.message.includes('401') || 
                        profileError.message.includes('Unauthorized') || 
                        profileError.message.includes('Authentication failed')) {
                console.log('🔒 Auth error detected, clearing admin tokens');
                AuthCookies.clearAdminTokens();
              } else {
                console.log('❓ Unknown error type, keeping tokens');
              }
            }
            throw profileError; // Re-throw to be caught by outer catch
          }
        } else {
          console.log('❌ No admin tokens found');
        }
      } catch (error) {
        console.error('❌ Admin auto-login failed:', error);
        
        // Only clear admin tokens if the error is specifically auth-related
        if (error instanceof Error) {
          if (error.message.includes('401') || 
              error.message.includes('Unauthorized') || 
              error.message.includes('Authentication failed')) {
            console.log('🔒 Auth error detected, clearing admin tokens only');
            AuthCookies.clearAdminTokens();
          } else {
            console.log('🌐 Network/other error, keeping tokens for retry');
          }
        }
      } finally {
        clearTimeout(timeoutId);
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
    
    // Set admin from login response (no need for additional API call)
    setAdmin(response.admin);
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
    AuthCookies.clearAdminTokens();
    setAdmin(null);
  };

  const refreshAdmin = async () => {
    try {
      const profile = await api.adminAuth.getAdminProfile();
      setAdmin(profile);
    } catch (error) {
      // If getting profile fails, admin might be logged out
      setAdmin(null);
      AuthCookies.clearAdminTokens();
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