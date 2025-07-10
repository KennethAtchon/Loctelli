'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, CheckCircle, Circle, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { IntegrationTemplate, Integration } from '@/lib/api';

export default function IntegrationsPage() {
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, integrationsData] = await Promise.all([
        api.integrationTemplates.getActive(),
        api.integrations.getAll()
      ]);
      setTemplates(templatesData);
      setIntegrations(integrationsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integrations data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await api.integrations.deleteIntegration(id);
      await loadData(); // Reload to get updated list
      toast({
        title: 'Success',
        description: 'Integration deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete integration',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const getIntegrationForTemplate = (templateId: number) => {
    return integrations.find(integration => integration.integrationTemplateId === templateId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'disconnected':
        return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'crm':
        return <Settings className="h-5 w-5" />;
      case 'advertising':
        return <Zap className="h-5 w-5" />;
      case 'analytics':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading integrations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect your external services and platforms
          </p>
        </div>
        <Button onClick={() => router.push('/admin/integrations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Setup Integration
        </Button>
      </div>

      {/* Integration Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {templates.map((template) => {
          const integration = getIntegrationForTemplate(template.id);
          const isConfigured = !!integration;

          return (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      {template.displayName}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfigured ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Category and Status */}
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{template.category}</Badge>
                    {isConfigured && integration && getStatusBadge(integration.status)}
                  </div>

                  {/* Configuration Status */}
                  <div className="text-sm text-gray-600">
                    {isConfigured ? (
                      <div>
                        <div className="font-medium">Configured as: {integration.name}</div>
                        {integration.lastSyncAt && (
                          <div className="text-xs text-gray-500">
                            Last sync: {(() => {
                              const date = new Date(integration.lastSyncAt);
                              return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                            })()}
                          </div>
                        )}
                        {integration.errorMessage && (
                          <div className="text-xs text-red-500 mt-1">
                            Error: {integration.errorMessage}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">Not configured</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {isConfigured && integration ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/integrations/${integration.id}/edit`)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deleting === integration.id}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this integration? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(integration.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/integrations/new?template=${template.id}`)}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Setup Integration
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No integration templates available</div>
          <Button onClick={() => router.push('/admin/integration-templates')}>
            Manage Templates
          </Button>
        </div>
      )}
    </div>
  );
} 