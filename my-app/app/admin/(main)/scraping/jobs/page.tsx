'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Play, 
  Pause,
  Square,
  Download, 
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from '@/lib/api';
import { ScrapingJob, ScrapingJobStatus, PaginatedResponse } from '@/types/scraping';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ScrapingJobsPage() {
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScrapingJobStatus | 'ALL'>('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadJobs();
  }, [pagination.page, statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const response = await api.scraping.getJobs(params);
      if (response.success) {
        setJobs(response.data.jobs || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages || Math.ceil(response.data.total / prev.limit)
        }));
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast.error('Failed to load scraping jobs');
    } finally {
      setLoading(false);
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
        loadJobs(); // Refresh the list
      }
    } catch (error) {
      toast.error(`Failed to ${action} job`);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.scraping.deleteJob(jobId);
      if (response.success) {
        toast.success('Job deleted successfully');
        loadJobs();
      }
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const getStatusBadge = (status: ScrapingJobStatus) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgress = (job: ScrapingJob) => {
    if (job.totalPages === 0) return 0;
    return Math.round((job.processedPages / job.totalPages) * 100);
  };

  const filteredJobs = jobs.filter(job => 
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scraping Jobs</h1>
          <p className="text-muted-foreground">
            Manage and monitor your web scraping jobs
          </p>
        </div>
        
        <Button asChild>
          <Link href="/admin/scraping/jobs/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by name or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ScrapingJobStatus | 'ALL')}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="RUNNING">Running</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-5 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{job.name}</h3>
                      {getStatusBadge(job.status)}
                      {job.status === 'RUNNING' && (
                        <Badge variant="outline" className="bg-blue-50">
                          {getProgress(job)}% Complete
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span className="truncate max-w-md">{job.targetUrl}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(job.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pages:</span>{' '}
                        <span className="font-medium">{job.processedPages}/{job.totalPages || job.maxPages}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Items:</span>{' '}
                        <span className="font-medium">{job.extractedItems}</span>
                      </div>
                      {job.startedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Started {formatDate(job.startedAt)}</span>
                        </div>
                      )}
                    </div>

                    {job.status === 'RUNNING' && job.totalPages > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgress(job)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Action Buttons */}
                    {job.status === 'PENDING' || job.status === 'PAUSED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJobAction(job.id, 'start')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}
                    
                    {job.status === 'RUNNING' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJobAction(job.id, 'pause')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : null}

                    {(job.status === 'RUNNING' || job.status === 'PAUSED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJobAction(job.id, 'cancel')}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    )}

                    {job.status === 'COMPLETED' && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/scraping/jobs/${job.id}/results`}>
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}

                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/scraping/jobs/${job.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/scraping/jobs/${job.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {job.status === 'COMPLETED' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/scraping/jobs/${job.id}/results`}>
                              View Results
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={job.status === 'RUNNING'}
                        >
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'No jobs match your filters' 
                    : 'No scraping jobs yet'
                  }
                </p>
                {!searchQuery && statusFilter === 'ALL' && (
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/admin/scraping/jobs/create">
                      Create Your First Job
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} jobs
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}