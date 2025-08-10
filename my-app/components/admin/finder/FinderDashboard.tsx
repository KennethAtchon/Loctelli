'use client';

import React, { useState, useEffect } from 'react';
import { Search, History, Settings, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SearchForm } from './SearchForm';
import { ResultsTable } from './ResultsTable';
import { ExportDialog } from './ExportDialog';
import { ApiKeyManager } from './ApiKeyManager';
import { 
  SearchBusinessDto, 
  SearchResponseDto, 
  BusinessSearchResultDto,
  ApiSource,
  UsageStats,
  SearchHistory,
  JobStatusDto,
  finderApi 
} from '@/lib/api/endpoints/finder';

export function FinderDashboard() {
  const [searchResponse, setSearchResponse] = useState<SearchResponseDto | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [availableSources, setAvailableSources] = useState<ApiSource[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusDto | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [sourcesRes, statsRes, historyRes] = await Promise.all([
          finderApi.getAvailableSources(),
          finderApi.getUsageStats(),
          finderApi.getSearchHistory(undefined, 10),
        ]);

        setAvailableSources(sourcesRes.sources);
        setUsageStats(statsRes);
        setSearchHistory(historyRes);
      } catch (error: any) {
        console.error('Failed to load initial data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSearch = async (searchData: SearchBusinessDto) => {
    setIsSearching(true);
    setSearchResponse(null);
    setCurrentJobId(null);
    setJobStatus(null);
    
    try {
      // Always use async processing since all searches call external APIs with latency
      toast.info('Starting search in background. This may take a moment...');
      
      // Start async job
      const jobResponse = await finderApi.searchBusinessesAsync(searchData);
      setCurrentJobId(jobResponse.jobId);
      
      // Start polling for job status
      pollJobStatus(jobResponse.jobId);
      
      const sourceName = searchData.sources?.[0] || 'default source';
      toast.success(`Search queued! Calling ${sourceName} API...`);
      
    } catch (error: any) {
      console.error('Search failed:', error);
      let errorMessage = 'Search failed. Please try again.';
      
      if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service unavailable. Please check your API keys or try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      setIsSearching(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (5s intervals)
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        const status = await finderApi.getJobStatus(jobId);
        setJobStatus(status);
        
        if (status.status === 'completed') {
          setIsSearching(false);
          setCurrentJobId(null);
          
          if (status.searchResult) {
            setSearchResponse(status.searchResult);
            toast.success(`Search completed! Found ${status.searchResult.totalResults} businesses in ${status.searchResult.responseTime}ms`);
          }
          
          // Refresh dashboard data
          await refreshDashboardData();
          return;
        } else if (status.status === 'failed') {
          setIsSearching(false);
          setCurrentJobId(null);
          toast.error(status.error || 'Search failed');
          return;
        } else if (attempts >= maxAttempts) {
          setIsSearching(false);
          setCurrentJobId(null);
          toast.error('Search timed out. Please try again.');
          return;
        }
        
        // Continue polling every 5 seconds
        setTimeout(poll, 5000);
      } catch (error: any) {
        console.error('Failed to poll job status:', error);
        if (attempts >= maxAttempts) {
          setIsSearching(false);
          setCurrentJobId(null);
          toast.error('Unable to get search status. Please refresh the page.');
        } else {
          // Retry after 5 seconds
          setTimeout(poll, 5000);
        }
      }
    };
    
    // Start first poll after 2 seconds
    setTimeout(poll, 2000);
  };

  const refreshDashboardData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        finderApi.getUsageStats(),
        finderApi.getSearchHistory(undefined, 10),
      ]);
      setUsageStats(statsRes);
      setSearchHistory(historyRes);
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  };

  const handleExportResults = (results: BusinessSearchResultDto[]) => {
    if (!searchResponse) {
      toast.error('No search results available for export');
      return;
    }
    setExportDialogOpen(true);
  };

  const handleHistorySearch = async (historyItem: SearchHistory) => {
    try {
      const response = await finderApi.getSearchResult(historyItem.id);
      setSearchResponse(response);
      toast.success('Previous search results loaded');
    } catch (error) {
      console.error('Failed to load search history:', error);
      toast.error('Failed to load previous search results');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Business Finder</h1>
          <p className="text-muted-foreground">
            Search for businesses across multiple data sources
          </p>
        </div>
        
        {usageStats && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">
                {usageStats.remaining} / {usageStats.dailyLimit} searches remaining
              </p>
              <p className="text-xs text-muted-foreground">
                {usageStats.totalSearches} total searches
              </p>
            </div>
            {usageStats.isBlocked && (
              <Alert className="max-w-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Rate limit exceeded. Access will be restored tomorrow.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <SearchForm
            onSearch={handleSearch}
            isSearching={isSearching}
            availableSources={availableSources}
          />
          
          {/* Job Status Indicator */}
          {currentJobId && jobStatus && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      {jobStatus.status === 'pending' && 'Search queued and waiting to start...'}
                      {jobStatus.status === 'processing' && 'Calling API (this may take a few seconds)...'}
                    </p>
                    <p className="text-sm text-blue-700">
                      Job ID: {currentJobId} • Status: {jobStatus.status}
                      {jobStatus.progress && ` • Progress: ${jobStatus.progress}%`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {searchResponse && (
            <ResultsTable
              searchResponse={searchResponse}
              onExport={handleExportResults}
            />
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
              <CardDescription>
                Your recent business searches and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No search history available
                </div>
              ) : (
                <div className="space-y-3">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => handleHistorySearch(item)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.query}</p>
                          {item.location && (
                            <Badge variant="outline">{item.location}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{item.totalResults} results</span>
                          <span>{item.sources.join(', ')}</span>
                          {item.responseTime && (
                            <span>{item.responseTime}ms</span>
                          )}
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <ApiKeyManager />
        </TabsContent>

        <TabsContent value="stats">
          {usageStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.totalSearches}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.totalResults.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.averageResponseTime}ms</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usageStats.remaining}/{usageStats.dailyLimit}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {usageStats.isBlocked ? 'Blocked' : 'Available'}
                  </p>
                </CardContent>
              </Card>
              
              {Object.keys(usageStats.sourcesUsed).length > 0 && (
                <Card className="md:col-span-2 lg:col-span-4">
                  <CardHeader>
                    <CardTitle>API Source Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(usageStats.sourcesUsed).map(([source, count]) => (
                        <div key={source} className="text-center">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {source.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        searchId={searchResponse?.searchId || null}
        results={searchResponse?.results || []}
      />
    </div>
  );
}