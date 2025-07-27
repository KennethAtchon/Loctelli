'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  TestTube, 
  Settings, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface SmsSettings {
  rateLimitPerMinute: number;
  maxBatchSize: number;
  retryAttempts: number;
  twilioConfigured: boolean;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export default function SmsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
  });
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadServiceStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.sms.getSettings();
      if (response?.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load SMS settings:', error);
      toast.error('Failed to load SMS settings');
    }
  };

  const loadServiceStatus = async () => {
    try {
      const response = await api.sms.getServiceStatus();
      if (response?.success) {
        setServiceStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load service status:', error);
    }
  };

  const handleTwilioConfigChange = (field: keyof TwilioConfig, value: string) => {
    setTwilioConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Save Twilio configuration
      const configResponse = await api.sms.updateTwilioConfig(twilioConfig);
      if (configResponse?.success) {
        toast.success('Twilio configuration saved successfully');
        loadSettings();
        loadServiceStatus();
      } else {
        toast.error(configResponse?.message || 'Failed to save Twilio configuration');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await api.sms.testConnection();
      
      if (response?.success) {
        toast.success('Twilio connection test successful!');
      } else {
        toast.error(response?.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const getServiceStatusBadge = (configured: boolean) => {
    if (configured) {
      return <Badge variant="default" className="bg-green-500">Configured</Badge>;
    } else {
      return <Badge variant="destructive">Not Configured</Badge>;
    }
  };

  const getServiceStatusIcon = (configured: boolean) => {
    if (configured) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/sms">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SMS
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SMS Settings</h1>
            <p className="text-muted-foreground">
              Configure Twilio integration and SMS preferences
            </p>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getServiceStatusIcon(settings?.twilioConfigured || false)}
              <span className="font-medium">Twilio Integration</span>
              {getServiceStatusBadge(settings?.twilioConfigured || false)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || !settings?.twilioConfigured}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
          {serviceStatus && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span>Account SID:</span>
                  <span className="font-mono text-xs">
                    {serviceStatus.accountSid ? '••••••••••••••••••••••••••••••••' : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phone Number:</span>
                  <span className="font-mono text-xs">
                    {serviceStatus.phoneNumber || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Test:</span>
                  <span className="text-xs">
                    {serviceStatus.lastTested ? new Date(serviceStatus.lastTested).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Twilio Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Twilio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountSid">Account SID *</Label>
            <Input
              id="accountSid"
              type="password"
              placeholder="Enter your Twilio Account SID"
              value={twilioConfig.accountSid}
              onChange={(e) => handleTwilioConfigChange('accountSid', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Twilio Console dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authToken">Auth Token *</Label>
            <Input
              id="authToken"
              type="password"
              placeholder="Enter your Twilio Auth Token"
              value={twilioConfig.authToken}
              onChange={(e) => handleTwilioConfigChange('authToken', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Twilio Console dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Twilio Phone Number *</Label>
            <Input
              id="phoneNumber"
              placeholder="Enter your Twilio phone number (e.g., +1234567890)"
              value={twilioConfig.phoneNumber}
              onChange={(e) => handleTwilioConfigChange('phoneNumber', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The phone number that will be used to send SMS messages
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={handleSaveSettings} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMS Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            SMS Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rate Limit</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={settings?.rateLimitPerMinute || 60}
                  disabled
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">messages per minute</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum SMS messages per minute
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Batch Size</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={settings?.maxBatchSize || 100}
                  disabled
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">messages per batch</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum messages processed in one batch
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Retry Attempts</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={settings?.retryAttempts || 3}
                  disabled
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">attempts</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Number of retry attempts for failed messages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="compliance" defaultChecked disabled />
              <Label htmlFor="compliance">TCPA Compliance</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically include opt-out instructions in messages
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="logging" defaultChecked disabled />
              <Label htmlFor="logging">Audit Logging</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Log all SMS activities for compliance and debugging
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="validation" defaultChecked disabled />
              <Label htmlFor="validation">Phone Validation</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Validate phone numbers before sending messages
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Getting Started</h4>
            <p className="text-sm text-muted-foreground">
              1. Sign up for a Twilio account at{' '}
              <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                twilio.com
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              2. Get your Account SID and Auth Token from the Twilio Console
            </p>
            <p className="text-sm text-muted-foreground">
              3. Purchase a phone number in the Twilio Console
            </p>
            <p className="text-sm text-muted-foreground">
              4. Enter your credentials above and test the connection
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Important Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Keep your Auth Token secure and never share it</li>
              <li>• SMS costs vary by destination country</li>
              <li>• Ensure compliance with local SMS regulations</li>
              <li>• Test with small batches before sending large campaigns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 