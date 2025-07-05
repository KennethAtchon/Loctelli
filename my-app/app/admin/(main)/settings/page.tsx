'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/contexts/admin-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, Eye, EyeOff, RefreshCw, User, Mail, Lock, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { admin, refreshAdmin } = useAdminAuth();
  const [currentAuthCode, setCurrentAuthCode] = useState('');
  const [newAuthCode, setNewAuthCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);
  
  // Profile management state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setProfileData({
        name: admin.name || '',
        email: admin.email || '',
      });
    }
    
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
      toast.error('Failed to load current auth code');
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
      toast.error('Failed to generate new auth code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);

    try {
      const updatedProfile = await api.adminAuth.updateAdminProfile(profileData);
      await refreshAdmin(); // Refresh the admin context
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 12) {
      toast.error('New password must be at least 12 characters long');
      return;
    }

    setIsPasswordLoading(true);

    try {
      await api.adminAuth.changeAdminPassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Clear password fields
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-gray-600">Manage admin settings and configurations</p>
        {admin && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
              {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
            <span className="text-sm text-gray-500">
              {admin.role === 'super_admin' ? 'Full system access' : 'Standard admin access'}
            </span>
          </div>
        )}
      </div>

      {/* Profile Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isProfileLoading}>
              {isProfileLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showPasswords.old ? 'text' : 'password'}
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                >
                  {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 12 characters with uppercase, lowercase, number, and special character
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <Button type="submit" disabled={isPasswordLoading}>
              {isPasswordLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Super Admin Only Section */}
      {admin?.role === 'super_admin' && (
        <>
          <Separator />
          
          {/* Admin Authorization Code Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Authorization Code
                <Badge variant="default">Super Admin Only</Badge>
              </CardTitle>
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
        </>
      )}

      {/* Regular Admin Information */}
      {admin?.role !== 'super_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Administration
            </CardTitle>
            <CardDescription>
              Information about admin privileges and system access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Your Access Level</h3>
              <p className="text-xs text-gray-600">
                As a regular admin, you have access to user management, system monitoring, and your own profile settings.
                System-level configurations like authorization codes are restricted to super administrators.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Available Features</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Manage user accounts and permissions</li>
                <li>• Monitor system activity and statistics</li>
                <li>• Update your profile information</li>
                <li>• Change your account password</li>
                <li>• Access client and booking management</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Need More Access?</h3>
              <p className="text-xs text-gray-600">
                If you need access to system-level configurations, please contact a super administrator.
                Super admins can manage authorization codes and perform system-wide administrative tasks.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 