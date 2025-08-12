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
  <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/60 dark:border-slate-600/60 shadow-lg">
    <CardContent className="pt-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{provider.name}</h4>
          <Button variant="outline" size="sm" asChild className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors">
            <a href={provider.signupUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Get API Key
            </a>
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{provider.description}</p>
        <div className="text-sm">
          <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
            {provider.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">{provider.freeQuota}</Badge>
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
      <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Add New API Key
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div>
            <Label htmlFor="service" className="text-sm font-semibold text-gray-700 dark:text-gray-300">API Provider *</Label>
            <Select value={formData.service} onValueChange={(value) => handleInputChange('service', value)}>
              <SelectTrigger className="mt-2 border-gray-200/60 dark:border-slate-600/60 focus:border-blue-500 focus:ring-blue-500/20">
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
              <Label htmlFor="keyName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Key Name *</Label>
              <Input
                id="keyName"
                value={formData.keyName}
                onChange={(e) => handleInputChange('keyName', e.target.value)}
                placeholder="e.g., My Google API Key"
                className="mt-2 border-gray-200/60 dark:border-slate-600/60 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <Label htmlFor="dailyLimit" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daily Limit (optional)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={formData.dailyLimit}
                onChange={(e) => handleInputChange('dailyLimit', e.target.value)}
                placeholder="e.g., 1000"
                className="mt-2 border-gray-200/60 dark:border-slate-600/60 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <Label htmlFor="keyValue" className="text-sm font-semibold text-gray-700 dark:text-gray-300">API Key *</Label>
            <div className="relative mt-2">
              <Input
                id="keyValue"
                type={showKeyValue ? 'text' : 'password'}
                value={formData.keyValue}
                onChange={(e) => handleInputChange('keyValue', e.target.value)}
                placeholder="Paste your API key here"
                className="border-gray-200/60 dark:border-slate-600/60 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                onClick={() => setShowKeyValue(!showKeyValue)}
              >
                {showKeyValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
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
              className="border-gray-200/60 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="relative mr-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Key className="h-2 w-2 text-white" />
                    </div>
                  </div>
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
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Key className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                API Key Management
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your API keys for different business data providers
              </CardDescription>
            </div>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mb-6">
                <Key className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No API Keys Configured</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Add your API keys to unlock additional data sources and higher rate limits for better search results.
              </p>
              <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
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
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          {formatServiceName(key.service)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">{key.keyName}</TableCell>
                    <TableCell className="font-medium">{key.usageCount || 0}</TableCell>
                    <TableCell className="font-medium">
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b border-gray-100 dark:border-slate-700 pb-4">
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-purple-600" />
            Available API Providers
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Information about supported business data providers
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {API_PROVIDERS.map(provider => (
              <Card key={provider.id} className="group relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 border-gray-200/60 dark:border-slate-600/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">{provider.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                      {provider.freeQuota}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    {provider.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" asChild className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors">
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