# Business Search Async Optimization Strategy

## Problem Analysis

The current "Find Businesses" functionality has significant latency issues due to its **synchronous request/response architecture**. Users experience long wait times (often 10-30 seconds) while the system makes multiple external API calls to Google Places, Yelp, and OpenStreetMap.

### Current Architecture Issues

#### 1. **Blocking User Interface**
```typescript
// SearchForm.tsx - Current Implementation
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // User clicks button -> UI blocks for 10-30+ seconds
  await onSearch(searchData); // Synchronous wait
};

// FinderDashboard.tsx - Current Flow
const handleSearch = async (searchData: SearchBusinessDto) => {
  setIsSearching(true); // Shows spinner, but blocks everything
  
  try {
    const response = await finderApi.searchBusinesses(searchData); // BLOCKS HERE
    setSearchResponse(response);
    // ... more sequential calls
  } finally {
    setIsSearching(false);
  }
};
```

#### 2. **Sequential External API Calls**
```typescript
// business-finder.service.ts - Current Backend Flow
async searchBusinesses(searchDto: SearchBusinessDto, userId: number): Promise<SearchResponseDto> {
  // Step 1: Fetch default SubAccount (database query)
  const defaultSubAccount = await this.prisma.subAccount.findFirst({...});
  
  // Step 2: Rate limit check (Redis query)
  const canProceed = await this.rateLimitService.checkRateLimit(userId, ...);
  
  // Step 3: Multiple external API calls (Google Places, Yelp, OpenStreetMap)
  const searchPromises = availableSources.map(async (source) => {
    return await this.searchBySource(source, searchDto, apiKey); // Each takes 2-10 seconds
  });
  
  const searchResults = await Promise.all(searchPromises); // Still blocking
  
  // Step 4: Data processing + deduplication
  const mergedResults = this.deduplicateResults(allResults, limit);
  
  // Step 5: Database save
  const searchRecord = await this.saveSearchResult({...});
  
  return response; // Finally returns after 10-30+ seconds
}
```

#### 3. **Poor User Experience**
- **No Progressive Loading**: Users see nothing until all APIs complete
- **No Partial Results**: Even if Google Places returns quickly, users wait for all sources
- **Timeout Anxiety**: Users don't know if the system is working or stuck
- **No Cancellation**: Users can't stop a long-running search

## Proposed Async Architecture Solutions

### Solution 1: **Job Queue + WebSocket Updates**

Transform the search into an asynchronous job with real-time progress updates.

#### Backend Implementation

```typescript
// New: AsyncBusinessFinderService
@Injectable()
export class AsyncBusinessFinderService {
  constructor(
    private businessFinderService: BusinessFinderService,
    private searchJobQueue: SearchJobQueue, // Bull/BullMQ queue
    private webSocketGateway: SearchUpdatesGateway
  ) {}

  async initiateAsyncSearch(
    searchDto: SearchBusinessDto,
    userId: number
  ): Promise<{ jobId: string; estimatedTime: number }> {
    // Create search job immediately
    const jobId = uuidv4();
    const searchJob = await this.searchJobQueue.createSearchJob({
      jobId,
      userId,
      searchDto,
      status: 'queued',
      createdAt: new Date()
    });

    // Return immediately with job ID
    return {
      jobId,
      estimatedTime: this.estimateSearchTime(searchDto.sources?.length || 3)
    };
  }

  // Background job processor
  async processSearchJob(jobData: SearchJobData): Promise<void> {
    const { jobId, userId, searchDto } = jobData;
    
    try {
      // Emit progress updates via WebSocket
      this.webSocketGateway.emitSearchUpdate(userId, {
        jobId,
        status: 'processing',
        progress: 0,
        message: 'Initializing search...'
      });

      // Process each source individually with progress updates
      const results: BusinessSearchResultDto[] = [];
      const sources = searchDto.sources || ['google_places', 'yelp', 'openstreetmap'];
      
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const progress = Math.round(((i + 1) / sources.length) * 100);
        
        this.webSocketGateway.emitSearchUpdate(userId, {
          jobId,
          status: 'processing',
          progress,
          message: `Searching ${source}...`,
          partialResults: results // Send what we have so far
        });
        
        const sourceResults = await this.searchBySource(source, searchDto);
        results.push(...sourceResults);
        
        // Send partial results immediately
        this.webSocketGateway.emitSearchUpdate(userId, {
          jobId,
          status: 'processing',
          progress,
          message: `Found ${results.length} businesses so far...`,
          partialResults: results
        });
      }

      // Final processing and save
      const finalResults = this.deduplicateResults(results, searchDto.limit);
      const searchRecord = await this.saveSearchResult({
        jobId,
        userId,
        searchDto,
        results: finalResults
      });

      // Emit completion
      this.webSocketGateway.emitSearchUpdate(userId, {
        jobId,
        status: 'completed',
        progress: 100,
        message: `Search completed! Found ${finalResults.length} businesses.`,
        finalResults: finalResults,
        searchId: searchRecord.id
      });

    } catch (error) {
      this.webSocketGateway.emitSearchUpdate(userId, {
        jobId,
        status: 'failed',
        progress: 0,
        message: `Search failed: ${error.message}`,
        error: error.message
      });
    }
  }
}

// WebSocket Gateway for real-time updates
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: 'business-search'
})
export class SearchUpdatesGateway {
  @WebSocketServer() server: Server;

  emitSearchUpdate(userId: number, update: SearchProgressUpdate): void {
    this.server.to(`user-${userId}`).emit('search-progress', update);
  }

  @SubscribeMessage('join-search-room')
  handleJoinRoom(client: Socket, userId: number): void {
    client.join(`user-${userId}`);
  }
}
```

#### Frontend Implementation

```typescript
// New: useAsyncBusinessSearch hook
export function useAsyncBusinessSearch() {
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'completed' | 'failed'>('idle');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [partialResults, setPartialResults] = useState<BusinessSearchResultDto[]>([]);
  const [finalResults, setFinalResults] = useState<BusinessSearchResultDto[] | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(`${API_BASE_URL}/business-search`, {
      auth: { token: getAuthToken() }
    });

    newSocket.on('search-progress', (update: SearchProgressUpdate) => {
      if (update.jobId === currentJobId) {
        setProgress(update.progress);
        setProgressMessage(update.message);
        
        if (update.partialResults) {
          setPartialResults(update.partialResults);
        }
        
        if (update.status === 'completed' && update.finalResults) {
          setFinalResults(update.finalResults);
          setSearchStatus('completed');
        } else if (update.status === 'failed') {
          setSearchStatus('failed');
          toast.error(update.message);
        }
      }
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, [currentJobId]);

  const startAsyncSearch = async (searchData: SearchBusinessDto) => {
    try {
      setSearchStatus('searching');
      setProgress(0);
      setPartialResults([]);
      setFinalResults(null);

      // Initiate async search
      const response = await finderApi.initiateAsyncSearch(searchData);
      setCurrentJobId(response.jobId);
      
      // Join WebSocket room for updates
      if (socket) {
        socket.emit('join-search-room', getUserId());
      }

      toast.success(`Search started! Estimated time: ${response.estimatedTime}s`);
    } catch (error: any) {
      setSearchStatus('failed');
      toast.error(error.message || 'Failed to start search');
    }
  };

  const cancelSearch = async () => {
    if (currentJobId) {
      await finderApi.cancelSearchJob(currentJobId);
      setSearchStatus('idle');
      setCurrentJobId(null);
      toast.info('Search cancelled');
    }
  };

  return {
    searchStatus,
    progress,
    progressMessage,
    partialResults,
    finalResults,
    startAsyncSearch,
    cancelSearch
  };
}

// Updated SearchForm with async capabilities
export function SearchForm({ availableSources }: SearchFormProps) {
  const {
    searchStatus,
    progress,
    progressMessage,
    partialResults,
    finalResults,
    startAsyncSearch,
    cancelSearch
  } = useAsyncBusinessSearch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    const searchData: SearchBusinessDto = {
      query: query.trim(),
      location: location.trim() || undefined,
      radius: radius[0],
      sources: selectedSources,
      limit,
    };

    // Start async search - returns immediately
    await startAsyncSearch(searchData);
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... existing form fields ... */}
          
          {/* Enhanced search button with progress */}
          <div className="space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={searchStatus === 'searching'}
            >
              {searchStatus === 'searching' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching ({progress}%)
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Find Businesses
                </>
              )}
            </Button>
            
            {/* Progress indicator */}
            {searchStatus === 'searching' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progressMessage}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={cancelSearch}
                  >
                    Cancel
                  </Button>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Found {partialResults.length} businesses so far...
                </p>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Solution 2: **Streaming Response with Server-Sent Events (SSE)**

For a simpler implementation without WebSockets:

```typescript
// Backend: Streaming endpoint
@Controller('admin/finder')
export class FinderController {
  @Post('search-stream')
  @Sse('search-stream/:searchId')
  async streamSearch(
    @Param('searchId') searchId: string,
    @CurrentUser() user: any
  ): Promise<Observable<MessageEvent>> {
    return new Observable<MessageEvent>(observer => {
      this.businessFinderService.streamingSearch(searchId, user.userId, {
        onProgress: (update) => {
          observer.next({
            data: JSON.stringify(update),
            type: 'progress'
          } as MessageEvent);
        },
        onComplete: (results) => {
          observer.next({
            data: JSON.stringify({ type: 'complete', results }),
            type: 'complete'
          } as MessageEvent);
          observer.complete();
        },
        onError: (error) => {
          observer.error(error);
        }
      });
    });
  }
}

// Frontend: SSE implementation
export function useStreamingBusinessSearch() {
  const [results, setResults] = useState<BusinessSearchResultDto[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

  const startStreamingSearch = async (searchData: SearchBusinessDto) => {
    setStatus('searching');
    setResults([]);
    
    // Create search job and get search ID
    const { searchId } = await finderApi.createSearchJob(searchData);
    
    // Connect to SSE stream
    const eventSource = new EventSource(`/api/admin/finder/search-stream/${searchId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        setProgress(data.progress);
        if (data.partialResults) {
          setResults(prev => [...prev, ...data.partialResults]);
        }
      } else if (data.type === 'complete') {
        setResults(data.results);
        setStatus('completed');
        eventSource.close();
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setStatus('idle');
      eventSource.close();
    };
  };

  return { results, status, progress, startStreamingSearch };
}
```

### Solution 3: **Progressive Enhancement with Caching**

Improve the current architecture without major changes:

```typescript
// Enhanced business-finder.service.ts
@Injectable()
export class BusinessFinderService {
  async searchBusinesses(
    searchDto: SearchBusinessDto,
    userId: number,
    options: { streaming?: boolean } = {}
  ): Promise<SearchResponseDto> {
    
    // Return cached results immediately if available
    const cached = await this.getCachedResult(searchHash, userId);
    if (cached && !options.streaming) {
      return { ...cached, cached: true };
    }
    
    // Start with fastest source first (OpenStreetMap - no API key needed)
    const prioritizedSources = this.prioritizeSources(searchDto.sources);
    const results: BusinessSearchResultDto[] = [];
    
    for (const source of prioritizedSources) {
      try {
        const sourceResults = await this.searchBySource(source, searchDto);
        results.push(...sourceResults);
        
        // Return early results if we have enough
        if (results.length >= (searchDto.limit || 20)) {
          const earlyResults = this.deduplicateResults(results, searchDto.limit);
          
          // Continue processing other sources in background
          this.continueSearchInBackground(searchDto, userId, results, prioritizedSources.slice(1));
          
          return {
            searchId: `early-${Date.now()}`,
            results: earlyResults,
            partial: true,
            totalSources: prioritizedSources.length,
            completedSources: 1
          };
        }
      } catch (error) {
        this.logger.warn(`Search failed for ${source}: ${error.message}`);
      }
    }
    
    return this.buildResponse(results, searchDto);
  }
  
  private prioritizeSources(sources: string[]): string[] {
    // Prioritize by typical response time: OSM (fast) -> Google Places -> Yelp (slow)
    const priority = ['openstreetmap', 'google_places', 'yelp'];
    return sources.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
  }
  
  private async continueSearchInBackground(
    searchDto: SearchBusinessDto,
    userId: number,
    existingResults: BusinessSearchResultDto[],
    remainingSources: string[]
  ): Promise<void> {
    // Process remaining sources asynchronously
    const backgroundPromises = remainingSources.map(source => 
      this.searchBySource(source, searchDto).catch(err => [])
    );
    
    const backgroundResults = await Promise.all(backgroundPromises);
    const allResults = [...existingResults, ...backgroundResults.flat()];
    const finalResults = this.deduplicateResults(allResults, searchDto.limit);
    
    // Save complete results for future cache hits
    await this.saveSearchResult({
      userId,
      searchDto,
      results: finalResults,
      sources: [searchDto.sources?.[0] || 'openstreetmap', ...remainingSources]
    });
  }
}
```

## Implementation Recommendation

**Start with Solution 3 (Progressive Enhancement)** for immediate improvement:

1. **Phase 1**: Implement source prioritization and early returns
2. **Phase 2**: Add background processing for remaining sources  
3. **Phase 3**: Add job queue system (Solution 1) for complex searches

### Benefits of Each Approach:

| Solution | Implementation Effort | User Experience | Scalability |
|----------|----------------------|-----------------|-------------|
| **Progressive Enhancement** | Low | Good | Medium |
| **Job Queue + WebSocket** | High | Excellent | High |
| **Server-Sent Events** | Medium | Very Good | High |

### Immediate Quick Wins:

1. **Return OSM results first** (no API keys, fastest)
2. **Show partial results** as each source completes
3. **Implement request caching** for identical searches  
4. **Add search cancellation** capability
5. **Optimize database queries** (parallel user/subaccount lookups)

This approach transforms the user experience from "click and wait 30 seconds" to "see results in 2-5 seconds, with more results streaming in".