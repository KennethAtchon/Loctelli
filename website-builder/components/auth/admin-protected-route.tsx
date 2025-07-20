'use client';

import { useEffect } from 'react';
import { useAdminAuth } from '@/contexts/admin-auth-context';
import logger from '@/lib/logger';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminProtectedRoute({ children, fallback }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      logger.debug('🔒 Admin not authenticated, redirecting to main CRM login...');
      // Redirect to the main CRM login page
      const isDevelopment = process.env.NODE_ENV === 'development';
      const mainCrmUrl = isDevelopment ? 'http://localhost:3000' : 'https://loctelli.com';
      window.location.href = `${mainCrmUrl}/admin/login`;
    }
  }, [isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show redirect message if not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 