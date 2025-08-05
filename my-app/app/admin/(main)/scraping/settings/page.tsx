'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Database, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Server,
  Clock,
  MemoryStick,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { ScrapingServiceStatus } from '@/types/scraping';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ScrapingSettingsPage() {
  const [serviceStatus, setServiceStatus] = useState<ScrapingServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadServiceStatus();
  }, []);

  const loadServiceStatus = async () => {
    try {
      setLoading(true);
      const response = await api.scraping.getServiceStatus();
      if (response.success) {
        setServiceStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load service status:', error);
      toast.error('Failed to load service status');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      setRefreshing(true);
      await loadServiceStatus();
      toast.success('Service status refreshed');
    } catch (error) {
      toast.error('Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scraping Service Settings</h1>
          <p className="text-muted-foreground">
            Monitor and configure the web scraping service
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshStatus}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          <Button asChild>
            <Link href="/admin/scraping">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Service Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              {serviceStatus?.isHealthy ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : serviceStatus?.isHealthy ? 'Healthy' : 'Unhealthy'}
                </p>
                <p className="text-xs text-muted-foreground">Service Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : serviceStatus?.queueLength || 0}
                </p>
                <p className="text-xs text-muted-foreground">Queue Length</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : serviceStatus?.activeWorkers || 0}
                </p>
                <p className="text-xs text-muted-foreground">Active Workers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <MemoryStick className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : `${serviceStatus?.memoryUsage?.percentage || 0}%`}
                </p>
                <p className="text-xs text-muted-foreground">Memory Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Service Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service Health</span>
                  {serviceStatus?.isHealthy ? (
                    <Badge variant="default" className="bg-green-500">Healthy</Badge>
                  ) : (
                    <Badge variant="destructive">Unhealthy</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Queue Length</span>
                  <span className="text-sm text-muted-foreground">
                    {serviceStatus?.queueLength || 0} jobs
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Workers</span>
                  <span className="text-sm text-muted-foreground">
                    {serviceStatus?.activeWorkers || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {serviceStatus?.errorRate?.toFixed(1) || 0}%
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Used Memory</span>
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(serviceStatus?.memoryUsage?.used || 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Memory</span>
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(serviceStatus?.memoryUsage?.total || 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usage Percentage</span>
                  <span className="text-sm text-muted-foreground">
                    {serviceStatus?.memoryUsage?.percentage || 0}%
                  </span>
                </div>

                {/* Memory Usage Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(serviceStatus?.memoryUsage?.percentage || 0, 100)}%` 
                    }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Quick Actions</h4>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/scraping/jobs">
                    <Activity className="h-4 w-4 mr-2" />
                    View All Jobs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/scraping/jobs/create">
                    <Zap className="h-4 w-4 mr-2" />
                    Create New Job
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Troubleshooting</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={refreshStatus}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/dev">
                    <Database className="h-4 w-4 mr-2" />
                    System Diagnostics
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {!serviceStatus?.isHealthy && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Service Issues Detected</h4>
                  <p className="text-sm text-orange-600 mt-1">
                    The scraping service is currently experiencing issues. This is usually caused by Redis connection problems. 
                    You can still create and manage scraping jobs, but background processing may be affected.
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-orange-600">
                    <p>• Check that Redis container is running: <code>docker-compose ps</code></p>
                    <p>• Restart services: <code>docker-compose restart</code></p>
                    <p>• View logs: <code>docker-compose logs api</code></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}