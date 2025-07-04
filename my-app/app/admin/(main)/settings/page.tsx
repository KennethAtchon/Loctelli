'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/contexts/admin-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const [currentAuthCode, setCurrentAuthCode] = useState('');
  const [newAuthCode, setNewAuthCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (admin?.role === 'super_admin') {
      loadCurrentAuthCode();
    }
  }, [admin]);

  const loadCurrentAuthCode = async () => {
    try {
      setIsLoading(true);
      const response = await api.adminAuth.getCurrentAuthCode();
      setCurrentAuthCode(response.authCode);
    } catch (error) {
      setError('Failed to load current auth code');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewAuthCode = async () => {
    try {
      setIsLoading(true);
      const response = await api.adminAuth.generateAuthCode();
      setNewAuthCode(response.authCode);
      toast.success('New auth code generated successfully');
    } catch (error) {
      setError('Failed to generate new auth code');
      toast.error('Failed to generate new auth code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Auth code copied to clipboard');
  };

  if (admin?.role !== 'super_admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-gray-600">Manage admin settings and configurations</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need super admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Only super administrators can manage admin authorization codes and system settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-gray-600">Manage admin settings and configurations</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Admin Authorization Code Management */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Authorization Code</CardTitle>
          <CardDescription>
            Manage the authorization code required for admin registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Auth Code */}
          <div className="space-y-2">
            <Label>Current Authorization Code</Label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Input
                  type={showAuthCode ? 'text' : 'password'}
                  value={currentAuthCode}
                  readOnly
                  className="font-mono"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowAuthCode(!showAuthCode)}
                >
                  {showAuthCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentAuthCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              This is the current authorization code used for admin registration
            </p>
          </div>

          {/* Generate New Auth Code */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Generate New Authorization Code</h3>
                <p className="text-xs text-gray-500">
                  Create a new secure authorization code
                </p>
              </div>
              <Button
                onClick={generateNewAuthCode}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Generate New Code
              </Button>
            </div>

            {newAuthCode && (
              <div className="space-y-2">
                <Label>New Authorization Code</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={newAuthCode}
                    readOnly
                    className="font-mono bg-green-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newAuthCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">New</Badge>
                  <p className="text-xs text-gray-500">
                    Copy this code and update your environment variable ADMIN_AUTH_CODE
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
          <CardDescription>
            Important security notes about admin authorization codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Environment Variable</h3>
            <p className="text-xs text-gray-600">
              Set the ADMIN_AUTH_CODE environment variable in your .env file to change the authorization code.
            </p>
            <code className="block text-xs bg-gray-100 p-2 rounded">
              ADMIN_AUTH_CODE=your_secure_code_here
            </code>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Security Best Practices</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Use a strong, random authorization code</li>
              <li>• Keep the code secure and don't share it publicly</li>
              <li>• Change the code periodically for better security</li>
              <li>• Only share the code with trusted administrators</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">How It Works</h3>
            <p className="text-xs text-gray-600">
              When someone tries to register as an admin, they must provide the correct authorization code.
              This prevents unauthorized admin account creation and ensures only trusted individuals can become administrators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 