'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Play, 
  Download, 
  History, 
  Settings,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Pause,
  Square
} from 'lucide-react';
import { ScrapingStatsCards } from '@/components/scraping/scraping-stats-cards';
import { api } from '@/lib/api';
import { ScrapingStats, ScrapingJob, ScrapingServiceStatus } from '@/types/scraping';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ScrapingDashboardPage() {
  const [stats, setStats] = useState<ScrapingStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<ScrapingJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<ScrapingServiceStatus | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [
        statsResponse,
        recentJobsResponse,
        activeJobsResponse,
        statusResponse,
      ] = await Promise.all([
        api.scraping.getStats().catch(() => null),
        api.scraping.getJobs({ limit: 5 }).catch(() => null),
        api.scraping.getJobs({ status: 'RUNNING', limit: 10 }).catch(() => null),
        api.scraping.getServiceStatus().catch(() => null),
      ]);

      if (statsResponse?.success) {
        setStats(statsResponse.data || {
          totalJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          totalPagesScraped: 0,
          totalItemsExtracted: 0,
          averageProcessingTime: 0,
          successRate: 0
        });
      }

      if (recentJobsResponse?.success) {
        setRecentJobs(recentJobsResponse.data.jobs || []);
      }

      if (activeJobsResponse?.success) {
        setActiveJobs(activeJobsResponse.data.jobs || []);
      }

      if (statusResponse?.success) {
        setServiceStatus(statusResponse.data || {
          isHealthy: false,
          queueLength: 0,
          activeWorkers: 0,
          averageProcessingTime: 0,
          errorRate: 0
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'RUNNING':
        return <Badge variant="default" className="bg-blue-500">Running</Badge>;
      case 'PAUSED':
        return <Badge variant="secondary" className="bg-yellow-500">Paused</Badge>;
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleJobAction = async (jobId: number, action: 'start' | 'pause' | 'cancel') => {
    try {
      let response;
      switch (action) {
        case 'start':
          response = await api.scraping.startJob(jobId);
          break;
        case 'pause':
          response = await api.scraping.pauseJob(jobId);
          break;
        case 'cancel':
          response = await api.scraping.cancelJob(jobId);
          break;
      }

      if (response.success) {
        toast.success(`Job ${action}ed successfully`);
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      toast.error(`Failed to ${action} job`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Web Scraping Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your web scraping operations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/scraping/jobs/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/scraping/jobs">
              <Globe className="h-4 w-4 mr-2" />
              View All Jobs
            </Link>
          </Button>
        </div>
      </div>

      {/* Service Status Alert */}
      {serviceStatus && !serviceStatus.isHealthy && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <div className="font-medium text-orange-800">Scraping Service Unhealthy</div>
              <div className="text-sm text-orange-600">
                The scraping service is currently experiencing issues. Some features may be unavailable.
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/scraping/settings">
                <Settings className="h-4 w-4 mr-2" />
                Check Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <ScrapingStatsCards 
        stats={stats} 
        loading={loading} 
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="recent">Recent Jobs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/scraping/jobs/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Scraping Job
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/scraping/configs">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Configurations
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/scraping/jobs">
                    <History className="h-4 w-4 mr-2" />
                    View All Jobs
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin/scraping/settings">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Service Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Health</span>
                  {serviceStatus?.isHealthy ? (
                    <Badge variant="default" className="bg-green-500">Healthy</Badge>
                  ) : (
                    <Badge variant="destructive">Unhealthy</Badge>
                  )}
                </div>
                
                {serviceStatus && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Queue Length</span>
                      <span className="text-sm text-muted-foreground">
                        {serviceStatus.queueLength}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Workers</span>
                      <span className="text-sm text-muted-foreground">
                        {serviceStatus.activeWorkers}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {serviceStatus.errorRate.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}

                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/admin/scraping/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    View Detailed Status
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Jobs Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Active Jobs</h3>
            <Button asChild size="sm">
              <Link href="/admin/scraping/jobs?status=RUNNING">
                View All Active
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeJobs.length > 0 ? (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{job.name}</h4>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.targetUrl} • {job.processedPages}/{job.totalPages} pages
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Extracted: {job.extractedItems} items • Started: {formatDate(job.startedAt)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJobAction(job.id, 'pause')}
                          disabled={job.status !== 'RUNNING'}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJobAction(job.id, 'cancel')}
                          disabled={job.status === 'COMPLETED' || job.status === 'CANCELLED'}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/scraping/jobs/${job.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No active jobs</p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/admin/scraping/jobs/create">
                      Start Your First Job
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Jobs Tab */}
        <TabsContent value="recent" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Jobs</h3>
            <Button asChild size="sm">
              <Link href="/admin/scraping/jobs">
                View All Jobs
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{job.name}</h4>
                          {getStatusBadge(job.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(job.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {job.targetUrl}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Pages: {job.processedPages}/{job.totalPages} • Items: {job.extractedItems}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {job.status === 'COMPLETED' && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/scraping/jobs/${job.id}/results`}>
                              <Download className="h-4 w-4 mr-1" />
                              Results
                            </Link>
                          </Button>
                        )}
                        {job.status === 'PAUSED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobAction(job.id, 'start')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/scraping/jobs/${job.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No jobs yet</p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/admin/scraping/jobs/create">
                      Create Your First Job
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}