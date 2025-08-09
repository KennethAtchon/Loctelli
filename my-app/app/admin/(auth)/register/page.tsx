'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/admin-auth-context';
import type { AdminRegisterDto } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, CheckCircle, XCircle, Shield, UserPlus, ChevronRight, Building2, Loader2 } from 'lucide-react';
import logger from '@/lib/logger';

export default function AdminRegisterPage() {
  const router = useRouter();
  const { adminRegister } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [formData, setFormData] = useState<AdminRegisterDto>({
    name: '',
    email: '',
    password: '',
    authCode: '',
    role: 'admin',
  });

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    
    setPasswordValidation({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.debug('🔐 Admin register form submitted:', { email: formData.email });
    
    // Prevent multiple submissions
    if (isLoading) {
      logger.debug('🚫 Form already submitting, ignoring');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminRegister(formData);
      logger.debug('✅ Admin registration successful');
      setSuccess('Admin registration successful! You have been automatically logged in.');
      
      // Clear form
      setFormData({ name: '', email: '', password: '', authCode: '', role: 'admin' });
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (error) {
      logger.error('❌ Admin registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      logger.debug('📝 Set error message:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPgo8L3BhdHRlcm4+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4=')] opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Admin Registration
            </h1>
            <p className="text-purple-200/80 text-sm">
              Create your secure admin account
            </p>
          </div>
        </div>
        
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl w-full">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              <CardTitle className="text-white text-center">Admin Account Setup</CardTitle>
            </div>
            <CardDescription className="text-purple-200/70 text-center">
              Enter your details and authorization code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200" role="alert" aria-live="polite">
                  <AlertDescription className="flex items-center space-x-2" id="register-error">
                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200" role="alert" aria-live="polite">
                  <AlertDescription className="flex items-center space-x-2" id="register-success">
                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{success}</span>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/60 focus:border-purple-400 focus:ring-purple-400/50 backdrop-blur-sm transition-all duration-200"
                  aria-describedby={error ? 'register-error' : undefined}
                  aria-invalid={!!error}
                />
              </div>
              
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
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/60 focus:border-purple-400 focus:ring-purple-400/50 backdrop-blur-sm transition-all duration-200"
                  aria-describedby={error ? 'register-error' : undefined}
                  aria-invalid={!!error}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handlePasswordChange}
                    placeholder="Enter a strong password"
                    minLength={8}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/60 focus:border-purple-400 focus:ring-purple-400/50 backdrop-blur-sm transition-all duration-200 pr-12"
                    aria-describedby="password-requirements"
                    aria-invalid={!Object.values(passwordValidation).every(Boolean) && formData.password.length > 0}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-200/60 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent rounded"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Enhanced Password Validation */}
                {formData.password && (
                  <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm" id="password-requirements" aria-label="Password requirements">
                    <p className="text-xs font-medium text-purple-200 mb-2">Password Requirements:</p>
                    <div className="grid grid-cols-1 gap-1">
                      <div className={`flex items-center text-xs transition-colors ${passwordValidation.hasMinLength ? 'text-green-400' : 'text-purple-200/60'}`}>
                        {passwordValidation.hasMinLength ? <CheckCircle className="h-3 w-3 mr-2 text-green-400" /> : <XCircle className="h-3 w-3 mr-2 text-purple-200/60" />}
                        At least 8 characters
                      </div>
                      <div className={`flex items-center text-xs transition-colors ${passwordValidation.hasUppercase ? 'text-green-400' : 'text-purple-200/60'}`}>
                        {passwordValidation.hasUppercase ? <CheckCircle className="h-3 w-3 mr-2 text-green-400" /> : <XCircle className="h-3 w-3 mr-2 text-purple-200/60" />}
                        Uppercase letter (A-Z)
                      </div>
                      <div className={`flex items-center text-xs transition-colors ${passwordValidation.hasLowercase ? 'text-green-400' : 'text-purple-200/60'}`}>
                        {passwordValidation.hasLowercase ? <CheckCircle className="h-3 w-3 mr-2 text-green-400" /> : <XCircle className="h-3 w-3 mr-2 text-purple-200/60" />}
                        Lowercase letter (a-z)
                      </div>
                      <div className={`flex items-center text-xs transition-colors ${passwordValidation.hasNumber ? 'text-green-400' : 'text-purple-200/60'}`}>
                        {passwordValidation.hasNumber ? <CheckCircle className="h-3 w-3 mr-2 text-green-400" /> : <XCircle className="h-3 w-3 mr-2 text-purple-200/60" />}
                        Number (0-9)
                      </div>
                      <div className={`flex items-center text-xs transition-colors ${passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-purple-200/60'}`}>
                        {passwordValidation.hasSpecialChar ? <CheckCircle className="h-3 w-3 mr-2 text-green-400" /> : <XCircle className="h-3 w-3 mr-2 text-purple-200/60" />}
                        Special character (!@#$...)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white text-sm font-medium">
                  Admin Role
                </Label>
                <Select value={formData.role} onValueChange={handleRoleChange} disabled={isLoading}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-purple-400 focus:ring-purple-400/50 backdrop-blur-sm">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    <SelectItem value="admin" className="focus:bg-purple-600/20 focus:text-white">Admin</SelectItem>
                    <SelectItem value="super_admin" className="focus:bg-purple-600/20 focus:text-white">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="authCode" className="text-white text-sm font-medium">
                  Authorization Code
                </Label>
                <Input
                  id="authCode"
                  name="authCode"
                  type="password"
                  required
                  value={formData.authCode}
                  onChange={handleInputChange}
                  placeholder="Enter admin authorization code"
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/60 focus:border-purple-400 focus:ring-purple-400/50 backdrop-blur-sm transition-all duration-200"
                  aria-describedby="auth-code-help"
                />
                <p className="text-xs text-purple-200/60" id="auth-code-help">
                  Contact system administrator for the authorization code
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent"
                disabled={isLoading}
                aria-describedby={isLoading ? 'creating-account-status' : undefined}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span id="creating-account-status">Creating Account...</span>
                  </>
                ) : (
                  <>
                    Create Admin Account
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
                  <span className="bg-transparent px-2 text-purple-200/60 font-medium">Or</span>
                </div>
              </div>
              <div className="text-center space-y-3">
                <Link 
                  href="/admin/login" 
                  className="text-sm text-purple-300 hover:text-purple-200 transition-colors duration-200 flex items-center justify-center space-x-1 group"
                >
                  <span>Already have an admin account? Sign in here</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link 
                  href="/auth/register" 
                  className="text-sm text-purple-200/60 hover:text-purple-200/80 transition-colors duration-200 block"
                >
                  Regular user registration
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 