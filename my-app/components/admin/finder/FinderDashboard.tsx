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
    
    try {
      const response = await finderApi.searchBusinesses(searchData);
      setSearchResponse(response);
      
      // Refresh usage stats after search
      const statsRes = await finderApi.getUsageStats();
      setUsageStats(statsRes);
      
      // Refresh search history
      const historyRes = await finderApi.getSearchHistory(undefined, 10);
      setSearchHistory(historyRes);

      toast.success(`Found ${response.totalResults} businesses in ${response.responseTime}ms`);
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
    } finally {
      setIsSearching(false);
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