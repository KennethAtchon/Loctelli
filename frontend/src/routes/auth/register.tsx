import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/unified-auth-context';
import type { RegisterDto } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import logger from '@/lib/logger';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
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
  const [formData, setFormData] = useState<RegisterDto>({
    name: '',
    email: '',
    password: '',
    company: '',
    budget: '',
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

    logger.debug('🔐 Register form submitted:', { email: formData.email });

    // Prevent multiple submissions
    if (isLoading) {
      logger.debug('🚫 Form already submitting, ignoring');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(formData);
      logger.debug('✅ Registration successful');
      setSuccess(
        'Registration successful! You have been automatically logged in.'
      );

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        company: '',
        budget: '',
      });

      // Redirect to account page after 2 seconds
      setTimeout(() => {
        navigate({ to: '/account' });
      }, 2000);
    } catch (error) {
      logger.error('❌ Registration failed:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';
      setError(errorMessage);
      logger.debug('📝 Set error message:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create a new account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                    <br />
                    <small className="text-xs opacity-75">
                      Debug: Error state is active
                    </small>
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Real-time Password Validation */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Password Requirements:
                    </p>
                    <div className="space-y-1">
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasMinLength ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        At least 8 characters
                      </div>
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasUppercase ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        At least one uppercase letter
                      </div>
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasLowercase ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        At least one lowercase letter
                      </div>
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasNumber ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        At least one number
                      </div>
                      <div
                        className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasSpecialChar ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        At least one special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Enter your company name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (Optional)</Label>
                <Input
                  id="budget"
                  type="text"
                  value={formData.budget || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  placeholder="Enter your budget range"
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

