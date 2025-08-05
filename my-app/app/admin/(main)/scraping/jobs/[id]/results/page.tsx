'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Download, 
  Search,
  Eye,
  ExternalLink,
  Filter,
  Table,
  FileText
} from 'lucide-react';
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from '@/lib/api';
import { ScrapingJob, ScrapingResult, PaginatedResponse } from '@/types/scraping';
import { toast } from 'sonner';
import Link from 'next/link';

export default function JobResultsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = parseInt(params.id as string);
  
  const [job, setJob] = useState<ScrapingJob | null>(null);
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (jobId) {
      loadJob();
      loadResults();
    }
  }, [jobId, pagination.page]);

  const loadJob = async () => {
    try {
      const response = await api.scraping.getJob(jobId);
      if (response.success) {
        setJob(response.data);
      }
    } catch (error) {
      console.error('Failed to load job:', error);
      toast.error('Failed to load job details');
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await api.scraping.getJobResults(jobId, {
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setResults(response.data.results || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages || Math.ceil(response.data.total / prev.limit)
        }));
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load job results');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = async (format: 'csv' | 'json') => {
    try {
      const blob = await api.scraping.exportJobResults(jobId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job?.name || 'scraping-job'}-${jobId}-results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Results exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export results');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredResults = results.filter(result => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      result.url.toLowerCase().includes(searchLower) ||
      result.title?.toLowerCase().includes(searchLower) ||
      Object.values(result.data || {}).some(value => 
        String(value).toLowerCase().includes(searchLower)
      )
    );
  });

  // Get all unique data keys for table headers
  const dataKeys = results.length > 0 
    ? Array.from(new Set(results.flatMap(result => Object.keys(result.data || {}))))
    : [];

  if (loading && results.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold">Results</h1>
          <p className="text-muted-foreground">
            {job?.name} • {pagination.total} items extracted
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportResults('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => exportResults('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique URLs</p>
                <p className="text-2xl font-bold">{new Set(results.map(r => r.url)).size}</p>
              </div>
              <ExternalLink className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Fields</p>
                <p className="text-2xl font-bold">{dataKeys.length}</p>
              </div>
              <Table className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing Time</p>
                <p className="text-lg font-bold">
                  {results.length > 0 ? (
                    `${(results.reduce((sum, r) => sum + r.processingTime, 0) / results.length / 1000).toFixed(2)}s`
                  ) : '0s'}
                </p>
                <p className="text-xs text-muted-foreground">average per item</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search results by URL, title, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Badge variant="secondary">
              {filteredResults.length} of {results.length} shown
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Extracted Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
              <TableComponent>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">URL</TableHead>
                    <TableHead className="w-[150px]">Title</TableHead>
                    {dataKeys.map((key) => (
                      <TableHead key={key} className="min-w-[120px]">
                        {key}
                      </TableHead>
                    ))}
                    <TableHead className="w-[150px]">Extracted At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                          title={result.url}
                        >
                          {truncateText(result.url, 40)}
                        </a>
                      </TableCell>
                      <TableCell>
                        <span title={result.title} className="text-sm">
                          {truncateText(result.title || 'No title', 30)}
                        </span>
                      </TableCell>
                      {dataKeys.map((key) => (
                        <TableCell key={key}>
                          <span title={String(result.data?.[key] || '')} className="text-sm">
                            {truncateText(String(result.data?.[key] || ''), 50)}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(result.extractedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableComponent>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'No results match your search criteria.'
                  : 'This job hasn\'t extracted any data yet.'
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
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