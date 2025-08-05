'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Play, 
  Pause,
  Square,
  Download, 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Code,
  Settings,
  Activity,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { ScrapingJob, ScrapingJobStatus } from '@/types/scraping';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ScrapingJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = parseInt(params.id as string);
  
  const [job, setJob] = useState<ScrapingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (jobId) {
      loadJob();
      loadLogs();
      
      // Set up polling for running jobs
      const interval = setInterval(() => {
        if (job?.status === 'RUNNING') {
          loadJob();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [jobId, job?.status]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const response = await api.scraping.getJob(jobId);
      if (response.success) {
        setJob(response.data);
      }
    } catch (error) {
      console.error('Failed to load job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await api.scraping.getJobLogs(jobId);
      if (response.success) {
        setLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleJobAction = async (action: 'start' | 'pause' | 'cancel') => {
    try {
      setActionLoading(true);
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
        setJob(response.data);
      }
    } catch (error) {
      toast.error(`Failed to ${action} job`);
    } finally {
      setActionLoading(false);
    }
  };

  const exportResults = async (format: 'csv' | 'json') => {
    try {
      const blob = await api.scraping.exportJobResults(jobId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scraping-job-${jobId}-results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Results exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export results');
    }
  };

  const getStatusBadge = (status: ScrapingJobStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>;
      case 'RUNNING':
        return <Badge variant="default" className="bg-blue-500 flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Running
        </Badge>;
      case 'PAUSED':
        return <Badge variant="secondary" className="bg-yellow-500 flex items-center gap-1">
          <Pause className="h-3 w-3" />
          Paused
        </Badge>;
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>;
      case 'FAILED':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Square className="h-3 w-3" />
          Cancelled
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getProgress = () => {
    if (!job || job.totalPages === 0) return 0;
    return Math.round((job.processedPages / job.totalPages) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The scraping job you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link href="/admin/scraping/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{job.name}</h1>
            {getStatusBadge(job.status)}
          </div>
          <p className="text-muted-foreground">{job.description || 'No description provided'}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          {job.status === 'PENDING' || job.status === 'PAUSED' ? (
            <Button
              onClick={() => handleJobAction('start')}
              disabled={actionLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : null}
          
          {job.status === 'RUNNING' ? (
            <Button
              variant="outline"
              onClick={() => handleJobAction('pause')}
              disabled={actionLoading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : null}

          {(job.status === 'RUNNING' || job.status === 'PAUSED') && (
            <Button
              variant="outline"
              onClick={() => handleJobAction('cancel')}
              disabled={actionLoading}
            >
              <Square className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}

          {job.status === 'COMPLETED' && (
            <Button asChild>
              <Link href={`/admin/scraping/jobs/${job.id}/results`}>
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar for Running Jobs */}
      {job.status === 'RUNNING' && job.totalPages > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{getProgress()}% Complete</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{job.processedPages} of {job.totalPages} pages</span>
                <span>{job.extractedItems} items extracted</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pages Processed</p>
                <p className="text-2xl font-bold">{job.processedPages}</p>
                <p className="text-xs text-muted-foreground">of {job.totalPages || job.maxPages} max</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items Extracted</p>
                <p className="text-2xl font-bold">{job.extractedItems}</p>
                <p className="text-xs text-muted-foreground">data points</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm font-bold">{formatDate(job.createdAt)}</p>
                {job.startedAt && (
                  <p className="text-xs text-muted-foreground">Started {formatDate(job.startedAt)}</p>
                )}
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg font-bold">{job.status}</p>
                {job.completedAt && (
                  <p className="text-xs text-muted-foreground">Completed {formatDate(job.completedAt)}</p>
                )}
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          {job.status === 'COMPLETED' && (
            <TabsTrigger value="results">Results</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Target URL</h4>
                  <a 
                    href={job.targetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {job.targetUrl}
                  </a>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Limits</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>Max Pages: {job.maxPages}</p>
                    <p>Max Depth: {job.maxDepth}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Timing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p>{formatDate(job.createdAt)}</p>
                  </div>
                  {job.startedAt && (
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <p>{formatDate(job.startedAt)}</p>
                    </div>
                  )}
                  {job.completedAt && (
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <p>{formatDate(job.completedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  CSS Selectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(job.selectors || {}).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{key}</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{value}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User Agent:</span>
                    <span>{job.userAgent || 'Default'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delay Range:</span>
                    <span>{job.delayMin}ms - {job.delayMax}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeout:</span>
                    <span>{job.timeout}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No logs available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        {job.status === 'COMPLETED' && (
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Results
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportResults('json')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportResults('csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {job.extractedItems} items extracted from {job.processedPages} pages
                  </p>
                  <Button asChild>
                    <Link href={`/admin/scraping/jobs/${job.id}/results`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Results
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}