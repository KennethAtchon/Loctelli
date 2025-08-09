'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/admin-auth-context';
import type { AdminLoginDto } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, ChevronRight, Building2 } from 'lucide-react';
import logger from '@/lib/logger';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin, isAuthenticated, isLoading } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<AdminLoginDto>({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.debug('🔐 Admin login form submitted:', { email: formData.email });
    
    // Prevent multiple submissions
    if (isSubmitting) {
      logger.debug('🚫 Form already submitting, ignoring');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      await adminLogin(formData);
      logger.debug('✅ Admin login successful, redirecting...');
      router.push('/admin/dashboard');
    } catch (error) {
      logger.error('❌ Admin login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setError(errorMessage);
      logger.debug('📝 Set error message:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug form state changes
  useEffect(() => {
    logger.debug('🔄 Admin form state changed:', { isSubmitting, error, isAuthenticated, isLoading });
  }, [isSubmitting, error, isAuthenticated, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-white font-medium">Checking authentication...</p>
            <p className="text-blue-200 text-sm">Securing your admin session</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render the form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPgo8L3BhdHRlcm4+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4=')] opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-blue-200/80 text-sm">
              Secure access to your admin dashboard
            </p>
          </div>
        </div>
        
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl w-full">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white text-center">Admin Access</CardTitle>
            </div>
            <CardDescription className="text-blue-200/70 text-center">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200" role="alert" aria-live="polite">
                  <AlertDescription className="flex items-center space-x-2" id="login-error">
                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@example.com"
                  disabled={isSubmitting}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/60 focus:border-blue-400 focus:ring-blue-400/50 backdrop-blur-sm transition-all duration-200"
                  aria-describedby={error ? 'login-error' : undefined}
                  aria-invalid={!!error}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/60 focus:border-blue-400 focus:ring-blue-400/50 backdrop-blur-sm transition-all duration-200"
                  aria-describedby={error ? 'login-error' : undefined}
                  aria-invalid={!!error}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
                disabled={isSubmitting}
                aria-describedby={isSubmitting ? 'signing-in-status' : undefined}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span id="signing-in-status">Signing in...</span>
                  </>
                ) : (
                  <>
                    Sign in
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-blue-200/60 font-medium">Or</span>
                </div>
              </div>
              <div className="text-center space-y-3">
                <Link 
                  href="/admin/register" 
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors duration-200 flex items-center justify-center space-x-1 group"
                >
                  <span>Need an admin account? Register here</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link 
                  href="/auth/login" 
                  className="text-sm text-blue-200/60 hover:text-blue-200/80 transition-colors duration-200 block"
                >
                  Regular user login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 