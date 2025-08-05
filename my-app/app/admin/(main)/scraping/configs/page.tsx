'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { api } from '@/lib/api';
import { ScrapingConfig } from '@/types/scraping';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ScrapingConfigsPage() {
  const [configs, setConfigs] = useState<ScrapingConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.scraping.getConfigs();
      if (response.success) {
        setConfigs(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scraping Configurations</h1>
          <p className="text-muted-foreground">
            Manage reusable scraping configurations and templates
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Config
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Configuration
          </Button>
        </div>
      </div>

      {/* Configurations List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : configs.length > 0 ? (
        <div className="space-y-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{config.name}</h3>
                      <Badge variant="outline">Template</Badge>
                    </div>
                    
                    {config.description && (
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {formatDate(config.createdAt)}</span>
                      <span>Modified: {formatDate(config.updatedAt)}</span>
                    </div>

                    {/* Configuration Preview */}
                    <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                      <div className="flex items-center gap-4">
                        <span>Configuration saved</span>
                        {typeof config.config === 'object' && (
                          <span className="text-muted-foreground">
                            {Object.keys(config.config).length} settings
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-1" />
                      Clone
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Configurations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create reusable scraping configurations to speed up job creation
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/scraping/jobs/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Job from Template
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/scraping">
                <Settings className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}