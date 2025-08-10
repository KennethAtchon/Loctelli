'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, Edit, Save, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ApiKeyDto, finderApi } from '@/lib/api/endpoints/finder';

interface ApiKeyData extends Omit<ApiKeyDto, 'keyValue'> {
  usageCount: number;
  lastUsed?: string;
}

const API_PROVIDERS = [
  {
    id: 'google_places',
    name: 'Google Places API',
    description: 'Comprehensive business data from Google Maps',
    signupUrl: 'https://developers.google.com/maps/documentation/places/web-service/get-api-key',
    freeQuota: '1,500 requests/day',
    instructions: [
      'Go to Google Cloud Console',
      'Enable the Places API',
      'Create credentials (API Key)',
      'Restrict the key to Places API only',
    ],
  },
  {
    id: 'yelp',
    name: 'Yelp Fusion API',
    description: 'Rich business profiles with reviews and ratings',
    signupUrl: 'https://fusion.yelp.com',
    freeQuota: '5,000 requests/day',
    instructions: [
      'Create a Yelp Developer account',
      'Create a new app',
      'Copy the API Key from your app dashboard',
    ],
  },
];

interface ProviderInstructionsProps {
  provider: typeof API_PROVIDERS[0];
}

const ProviderInstructions: React.FC<ProviderInstructionsProps> = React.memo(({ provider }) => (
  <Card>
    <CardContent className="pt-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{provider.name}</h4>
          <Button variant="outline" size="sm" asChild>
            <a href={provider.signupUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Get API Key
            </a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{provider.description}</p>
        <div className="text-sm">
          <p className="font-medium mb-1">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            {provider.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
        <Badge variant="secondary">{provider.freeQuota}</Badge>
      </div>
    </CardContent>
  </Card>
));

interface AddKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ApiKeyDto) => Promise<void>;
}

function AddKeyDialogComponent({ open, onOpenChange, onSubmit }: AddKeyDialogProps) {
  const [formData, setFormData] = useState({
    service: '',
    keyName: '',
    keyValue: '',
    dailyLimit: '',
  });
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getProviderInfo = (serviceId: string) => {
    return API_PROVIDERS.find(p => p.id === serviceId);
  };

  const selectedProvider = formData.service ? getProviderInfo(formData.service) : null;

  const resetForm = () => {
    setFormData({
      service: '',
      keyName: '',
      keyValue: '',
      dailyLimit: '',
    });
    setShowKeyValue(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service || !formData.keyName.trim() || !formData.keyValue.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiKeyData: ApiKeyDto = {
        service: formData.service,
        keyName: formData.keyName.trim(),
        keyValue: formData.keyValue.trim(),
        dailyLimit: formData.dailyLimit ? parseInt(formData.dailyLimit) : undefined,
      };

      await onSubmit(apiKeyData);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New API Key</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div>
            <Label htmlFor="service">API Provider *</Label>
            <Select value={formData.service} onValueChange={(value) => handleInputChange('service', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select API provider" />
              </SelectTrigger>
              <SelectContent>
                {API_PROVIDERS.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider Instructions */}
          {selectedProvider && (
            <ProviderInstructions provider={selectedProvider} />
          )}

          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="keyName">Key Name *</Label>
              <Input
                id="keyName"
                value={formData.keyName}
                onChange={(e) => handleInputChange('keyName', e.target.value)}
                placeholder="e.g., My Google API Key"
              />
            </div>
            <div>
              <Label htmlFor="dailyLimit">Daily Limit (optional)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={formData.dailyLimit}
                onChange={(e) => handleInputChange('dailyLimit', e.target.value)}
                placeholder="e.g., 1000"
              />
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <Label htmlFor="keyValue">API Key *</Label>
            <div className="relative">
              <Input
                id="keyValue"
                type={showKeyValue ? 'text' : 'password'}
                value={formData.keyValue}
                onChange={(e) => handleInputChange('keyValue', e.target.value)}
                placeholder="Paste your API key here"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setShowKeyValue(!showKeyValue)}
              >
                {showKeyValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your API keys are encrypted and stored securely. They will only be used for business searches within this application.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add API Key
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyData | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await finderApi.getUserApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (apiKeyData: ApiKeyDto) => {
    try {
      await finderApi.saveApiKey(apiKeyData);
      await loadApiKeys();
      toast.success('API key added successfully');
    } catch (error: any) {
      console.error('Failed to save API key:', error);
      toast.error(error.response?.data?.message || 'Failed to save API key');
      throw error; // Re-throw so dialog can handle it
    }
  };

  const getProviderInfo = (serviceId: string) => {
    return API_PROVIDERS.find(p => p.id === serviceId);
  };

  const handleDeleteKey = async (service: string, keyName: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await finderApi.deleteApiKey(service, keyName);
      await loadApiKeys();
      toast.success('API key deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete API key:', error);
      toast.error(error.response?.data?.message || 'Failed to delete API key');
    }
  };

  const formatServiceName = (service: string) => {
    const provider = getProviderInfo(service);
    return provider ? provider.name : service.replace('_', ' ').toUpperCase();
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Manage your API keys for different business data providers
              </CardDescription>
            </div>
            <Button className="mb-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API Keys Configured</h3>
              <p className="text-muted-foreground mb-4">
                Add your API keys to unlock additional data sources and higher rate limits.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Key Name</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Daily Limit</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatServiceName(key.service)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{key.keyName}</TableCell>
                    <TableCell>{key.usageCount || 0}</TableCell>
                    <TableCell>
                      {key.dailyLimit ? key.dailyLimit.toLocaleString() : 'Unlimited'}
                    </TableCell>
                    <TableCell>
                      {key.lastUsed 
                        ? new Date(key.lastUsed).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.service, key.keyName)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Provider Information */}
      <Card>
        <CardHeader>
          <CardTitle>Available API Providers</CardTitle>
          <CardDescription>
            Information about supported business data providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {API_PROVIDERS.map(provider => (
              <Card key={provider.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {provider.freeQuota}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {provider.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" asChild>
                    <a href={provider.signupUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get API Key
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddKeyDialogComponent 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddKey}
      />
    </div>
  );
}