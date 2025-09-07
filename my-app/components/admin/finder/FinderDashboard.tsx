'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, History, Settings, BarChart3, AlertCircle, RefreshCw, Activity, Target, Building, MapPin, Clock, Database, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SearchForm } from './SearchForm';
import { ResultsTable } from './ResultsTable';
import { ExportDialog } from './ExportDialog';
import { SearchResultsModal } from './SearchResultsModal';
import { ApiKeyManager } from './ApiKeyManager';
import { 
  SearchBusinessDto, 
  SearchResponseDto, 
  BusinessSearchResultDto,
  ApiSource,
  UsageStats,
  SearchHistory,
  JobStatusDto
} from '@/lib/api/endpoints/finder';
import { api } from '@/lib/api';

export function FinderDashboard() {
  const [searchResponse, setSearchResponse] = useState<SearchResponseDto | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchResultsModalOpen, setSearchResultsModalOpen] = useState(false);
  const [modalSearchResponse, setModalSearchResponse] = useState<SearchResponseDto | null>(null);
  const [availableSources, setAvailableSources] = useState<ApiSource[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusDto | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const [sourcesRes, statsRes, historyRes] = await Promise.all([
        api.finder.getAvailableSources(),
        api.finder.getUsageStats(),
        api.finder.getSearchHistory(undefined, 10),
      ]);

      setAvailableSources(sourcesRes.sources);
      setUsageStats(statsRes);
      setSearchHistory(historyRes);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Cleanup error state on unmount
  useEffect(() => {
    return () => {
      setError(null);
    };
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
      const jobResponse = await api.finder.searchBusinessesAsync(searchData);
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
        const status = await api.finder.getJobStatus(jobId);
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
        api.finder.getUsageStats(),
        api.finder.getSearchHistory(undefined, 10),
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
      const response = await api.finder.getSearchResult(historyItem.id);
      setModalSearchResponse(response);
      setSearchResultsModalOpen(true);
      toast.success('Previous search results loaded');
    } catch (error) {
      console.error('Failed to load search history:', error);
      toast.error('Failed to load previous search results');
    }
  };

  const handleExportFromModal = (results: BusinessSearchResultDto[]) => {
    if (!modalSearchResponse) return;
    
    // Create a temporary search response for export
    const exportResponse: SearchResponseDto = {
      ...modalSearchResponse,
      results: results
    };
    
    // Set this as the current search response temporarily for export
    setSearchResponse(exportResponse);
    setExportDialogOpen(true);
    setSearchResultsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="p-0 h-auto text-destructive underline ml-2"
              onClick={loadDashboardData}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Business Finder
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Search for businesses across multiple data sources with powerful filtering and export capabilities
          </p>
        </div>
        <div className="flex justify-start lg:justify-end">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="relative bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 backdrop-blur-sm hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-600 dark:hover:to-slate-500 border-gray-200/60 dark:border-slate-600/60 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 transition-all duration-200 ${isRefreshing ? 'animate-spin text-blue-600' : 'group-hover:text-blue-600'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>


      {usageStats?.isBlocked && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Rate limit exceeded. Access will be restored tomorrow.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="search" className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
          <TabsList className="relative grid w-full grid-cols-4 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-gray-200/60 dark:border-slate-700/60 shadow-lg backdrop-blur-sm p-2 rounded-2xl">
            <TabsTrigger value="search" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 hover:bg-blue-50/50 dark:hover:bg-slate-600/50 transition-all duration-200 rounded-xl font-semibold">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 hover:bg-emerald-50/50 dark:hover:bg-slate-600/50 transition-all duration-200 rounded-xl font-semibold">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 hover:bg-purple-50/50 dark:hover:bg-slate-600/50 transition-all duration-200 rounded-xl font-semibold">
              <Settings className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 hover:bg-orange-50/50 dark:hover:bg-slate-600/50 transition-all duration-200 rounded-xl font-semibold">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="search" className="space-y-6">
          <SearchForm
            onSearch={handleSearch}
            isSearching={isSearching}
            availableSources={availableSources}
          />
          
          {/* Job Status Indicator */}
          {currentJobId && jobStatus && (
            <Card className="border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity className="h-3 w-3 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      {jobStatus.status === 'pending' && 'Search queued and waiting to start...'}
                      {jobStatus.status === 'processing' && 'Calling API (this may take a few seconds)...'}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
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
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-green-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Card className="relative bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-emerald-500/5 to-teal-500/10 pointer-events-none"></div>
              <CardHeader className="relative border-b border-gray-100/50 dark:border-slate-700/50 pb-6 bg-gradient-to-r from-emerald-50/50 via-white/50 to-teal-50/50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-gray-100 dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                      Recent Searches
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                      Your recent business searches with quick access to results
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative pt-8 pb-8 px-8 bg-gradient-to-br from-white/80 via-emerald-50/20 to-teal-50/30 dark:from-slate-800/80 dark:via-slate-700/20 dark:to-slate-800/30">
                {searchHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mb-6">
                      <History className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Search History</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Your recent searches will appear here for quick access and re-execution.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="group/item relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1"
                        onClick={() => handleHistorySearch(item)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-green-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-between p-6 border border-gray-200/60 dark:border-slate-600/60 rounded-2xl bg-gradient-to-r from-white via-emerald-50/20 to-teal-50/20 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:border-emerald-200 dark:hover:border-slate-500 transition-all duration-300">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-slate-600 dark:to-slate-500 rounded-xl">
                                <Search className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                              </div>
                              <p className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover/item:text-emerald-700 dark:group-hover/item:text-emerald-300 transition-colors">
                                {item.query}
                              </p>
                              {item.location && (
                                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 font-semibold">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {item.location}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-blue-100 dark:bg-slate-600 rounded-lg">
                                  <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-semibold text-blue-700 dark:text-blue-300">{item.totalResults} results</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-purple-100 dark:bg-slate-600 rounded-lg">
                                  <Database className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">{item.sources.join(', ')}</span>
                              </div>
                              {item.responseTime && (
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-amber-100 dark:bg-slate-600 rounded-lg">
                                    <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <span className="text-gray-600 dark:text-gray-400 font-medium">{item.responseTime}ms</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-gray-100 dark:bg-slate-600 rounded-lg">
                                  <Calendar className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                </div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                              <ArrowRight className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <ApiKeyManager />
        </TabsContent>

        <TabsContent value="stats">
          {usageStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-blue-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Total Searches</CardTitle>
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Search className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{usageStats.totalSearches}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">lifetime searches</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-emerald-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Total Results</CardTitle>
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <Building className="h-5 w-5 text-emerald-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{usageStats.totalResults.toLocaleString()}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">businesses found</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-purple-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-purple-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">Avg Response</CardTitle>
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{usageStats.averageResponseTime}ms</div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">response time</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-orange-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-orange-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Rate Limit</CardTitle>
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {usageStats.remaining}/{usageStats.dailyLimit}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${usageStats.isBlocked ? "text-red-600" : "text-green-600"}`}>
                        {usageStats.isBlocked ? 'Blocked' : 'Available'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {Object.keys(usageStats.sourcesUsed).length > 0 && (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="border-b border-gray-100 dark:border-slate-700 pb-4">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      API Source Usage
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                      Distribution of searches across different data sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {Object.entries(usageStats.sourcesUsed).map(([source, count]) => (
                        <div key={source} className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 border border-gray-200/60 dark:border-slate-600/60">
                          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{count}</div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
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

      {/* Search Results Modal */}
      <SearchResultsModal
        isOpen={searchResultsModalOpen}
        onClose={() => setSearchResultsModalOpen(false)}
        searchResponse={modalSearchResponse}
        onExport={handleExportFromModal}
      />
    </div>
  );
}