'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { LoginDto, RegisterDto, AuthResponse, UserProfile } from '@/lib/api';

export default function AuthUsageExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<{ access_token: string; refresh_token: string } | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState<LoginDto>({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterDto>({
    name: '',
    email: '',
    password: '',
    company: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response: AuthResponse = await api.auth.login(loginData);
      setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      });
      setUser(response.user);
      setMessage('Login successful!');
      
      // Store tokens in localStorage (in real app, use secure storage)
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
    } catch (error) {
      setMessage(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await api.auth.register(registerData);
      setMessage('Registration successful! Please login.');
      setRegisterData({ name: '', email: '', password: '', company: '' });
    } catch (error) {
      setMessage(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetProfile = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const profile = await api.auth.getProfile();
      setUser(profile);
      setMessage('Profile loaded successfully!');
    } catch (error) {
      setMessage(`Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await api.auth.logout();
      setTokens(null);
      setUser(null);
      setMessage('Logged out successfully!');
      
      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      setMessage(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!tokens?.refresh_token) {
      setMessage('No refresh token available');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await api.auth.refreshToken(tokens.refresh_token);
      setTokens(response);
      setMessage('Token refreshed successfully!');
      
      // Update tokens in localStorage
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
    } catch (error) {
      setMessage(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Authentication API Usage Example</h1>
      
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successful') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Register Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Register</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company (Optional)</label>
              <input
                type="text"
                value={registerData.company || ''}
                onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>

      {/* User Actions */}
      {tokens && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleGetProfile}
              disabled={isLoading}
              className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50"
            >
              Get Profile
            </button>
            <button
              onClick={handleRefreshToken}
              disabled={isLoading}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              Refresh Token
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* User Profile Display */}
      {user && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>ID:</strong> {user.id}
            </div>
            <div>
              <strong>Name:</strong> {user.name}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Role:</strong> {user.role}
            </div>
            <div>
              <strong>Company:</strong> {user.company || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
            </div>
            <div>
              <strong>Last Login:</strong> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
            </div>
            <div>
              <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Token Display */}
      {tokens && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">JWT Tokens</h2>
          <div className="space-y-2">
            <div>
              <strong>Access Token:</strong>
              <div className="text-xs bg-gray-100 p-2 rounded break-all">
                {tokens.access_token}
              </div>
            </div>
            <div>
              <strong>Refresh Token:</strong>
              <div className="text-xs bg-gray-100 p-2 rounded break-all">
                {tokens.refresh_token}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 