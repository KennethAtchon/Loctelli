'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
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

  // Check for existing admin tokens on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const adminAccessToken = localStorage.getItem('admin_access_token');
        if (adminAccessToken) {
          // Try to get admin profile
          const profile = await api.adminAuth.getAdminProfile();
          setAdmin(profile);
        }
      } catch (error) {
        // Clear invalid tokens
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  const adminLogin = async (credentials: AdminLoginDto) => {
    const response: AdminAuthResponse = await api.adminAuth.adminLogin(credentials);
    
    // Store admin tokens
    localStorage.setItem('admin_access_token', response.access_token);
    localStorage.setItem('admin_refresh_token', response.refresh_token);
    
    // Set admin
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
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    setAdmin(null);
  };

  const refreshAdmin = async () => {
    try {
      const profile = await api.adminAuth.getAdminProfile();
      setAdmin(profile);
    } catch (error) {
      // If getting profile fails, admin might be logged out
      setAdmin(null);
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
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