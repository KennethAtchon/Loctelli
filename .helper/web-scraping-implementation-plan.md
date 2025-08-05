# Web Scraping Implementation Plan

## Overview
This document outlines the implementation plan for adding a web scraping endpoint to the CRM application, following the established patterns used for SMS and Chat modules.

## Analysis of Existing Patterns

### SMS Module Structure
- **Frontend**: `/my-app/app/admin/(main)/sms/`
  - Main dashboard: `page.tsx` with stats cards, tabs, and quick actions
  - Sub-pages: `send/`, `bulk/`, `campaigns/`, `history/`, `settings/`
  - Uses stats cards, tabs UI, loading states, and action buttons

- **Backend**: `/project/src/main-app/modules/sms/`
  - Controller: Complete CRUD operations with guards and validation
  - Service: Business logic with external API integration (Twilio)
  - Module: Dependency injection setup

### Chat Module Structure
- **Frontend**: `/my-app/app/admin/(main)/chat/`
  - Single page application with real-time chat interface
  - Lead selection dropdown with filtering
  - Message history loading and display

- **Backend**: `/project/src/main-app/modules/chat/`
  - Controller: Message handling with lead-based access control
  - Service: AI integration and conversation management
  - DTOs: Structured data transfer objects

## Web Scraping Implementation Plan

### 1. Backend Implementation

#### 1.1 Module Structure
Create `/project/src/main-app/modules/scraping/` with:

```
scraping/
├── scraping.module.ts
├── scraping.controller.ts
├── scraping.service.ts
├── scraping.queue.ts
├── interfaces/
│   ├── scraping-job.interface.ts
│   ├── scraping-result.interface.ts
│   └── scraping-config.interface.ts
├── dto/
│   ├── create-scraping-job.dto.ts
│   ├── scraping-job-status.dto.ts
│   └── scraping-config.dto.ts
└── processors/
    ├── website-scraper.processor.ts
    ├── data-extractor.processor.ts
    └── content-parser.processor.ts
```

#### 1.2 Controller Endpoints (following SMS pattern)
```typescript
@Controller('scraping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScrapingController {
  // Job Management
  @Post('jobs')                    // Create scraping job
  @Get('jobs')                     // Get user's scraping jobs (paginated)
  @Get('jobs/:id')                 // Get specific job details
  @Delete('jobs/:id')              // Cancel/delete job
  
  // Job Execution
  @Post('jobs/:id/start')          // Start/resume job
  @Post('jobs/:id/pause')          // Pause job
  @Post('jobs/:id/cancel')         // Cancel running job
  
  // Results
  @Get('jobs/:id/results')         // Get job results (paginated)
  @Get('jobs/:id/export')          // Export results (CSV/JSON)
  @Get('jobs/:id/preview')         // Preview scraped data
  
  // Statistics & Monitoring
  @Get('stats')                    // User's scraping statistics
  @Get('jobs/:id/status')          // Real-time job status
  @Get('jobs/:id/logs')            // Job execution logs
  
  // Configuration
  @Post('configs')                 // Save scraping configuration
  @Get('configs')                  // Get saved configurations
  @Put('configs/:id')              // Update configuration
  @Delete('configs/:id')           // Delete configuration
  
  // Service Status
  @Get('service-status')           // Check scraping service health
  @Post('test-url')                // Test URL accessibility
}
```

#### 1.3 Database Schema (Prisma)
```prisma
model ScrapingJob {
  id            Int      @id @default(autoincrement())
  name          String
  description   String?
  status        ScrapingJobStatus @default(PENDING)
  
  // Configuration
  targetUrl     String
  maxPages      Int      @default(10)
  maxDepth      Int      @default(2)
  selectors     Json     // CSS selectors for data extraction
  filters       Json?    // Filtering rules
  schedule      Json?    // Cron schedule for recurring jobs
  
  // Results
  totalPages    Int      @default(0)
  processedPages Int     @default(0)
  extractedItems Int     @default(0)
  errors        Json?    // Error log
  results       Json?    // Scraped data
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  startedAt     DateTime?
  completedAt   DateTime?
  
  // Relationships
  userId        Int
  user          User     @relation(fields: [userId], references: [id])
  subAccountId  Int
  subAccount    SubAccount @relation(fields: [subAccountId], references: [id])
  
  @@map("scraping_jobs")
}

model ScrapingConfig {
  id           Int      @id @default(autoincrement())
  name         String
  description  String?
  
  // Configuration template
  config       Json     // Reusable scraping configuration
  
  // Metadata
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relationships
  userId       Int
  user         User     @relation(fields: [userId], references: [id])
  subAccountId Int
  subAccount   SubAccount @relation(fields: [subAccountId], references: [id])
  
  @@map("scraping_configs")
}

enum ScrapingJobStatus {
  PENDING
  RUNNING
  PAUSED
  COMPLETED
  FAILED
  CANCELLED
}
```

#### 1.4 Service Implementation
```typescript
@Injectable()
export class ScrapingService {
  // Job management
  async createJob(userId: number, subAccountId: number, jobData: CreateScrapingJobDto)
  async getJobs(userId: number, subAccountId: number, page: number, limit: number)
  async getJob(jobId: number, userId: number, subAccountId: number)
  async deleteJob(jobId: number, userId: number, subAccountId: number)
  
  // Job execution
  async startJob(jobId: number)
  async pauseJob(jobId: number)
  async cancelJob(jobId: number)
  
  // Results & Export
  async getJobResults(jobId: number, page: number, limit: number)
  async exportResults(jobId: number, format: 'csv' | 'json')
  async previewResults(jobId: number, limit: number)
  
  // Statistics
  async getStats(userId: number, subAccountId: number)
  async getJobStatus(jobId: number)
  async getJobLogs(jobId: number)
  
  // Configuration
  async saveConfig(userId: number, subAccountId: number, config: ScrapingConfigDto)
  async getConfigs(userId: number, subAccountId: number)
  
  // Utilities
  async testUrl(url: string)
  async validateSelectors(url: string, selectors: object)
  getServiceStatus()
}
```

#### 1.5 Queue Processing (Bull/Redis)
```typescript
@Processor('scraping')
export class ScrapingProcessor {
  @Process('scrape-website')
  async handleScrapingJob(job: Job<ScrapingJobData>) {
    // 1. Initialize browser session
    // 2. Navigate to target URL
    // 3. Apply extraction rules
    // 4. Process and clean data
    // 5. Store results
    // 6. Update job status
  }
}
```

### 2. Frontend Implementation

#### 2.1 Directory Structure
Create `/my-app/app/admin/(main)/scraping/` with:

```
scraping/
├── page.tsx                    // Main dashboard
├── jobs/
│   ├── page.tsx               // Jobs list
│   ├── [id]/
│   │   ├── page.tsx          // Job details
│   │   ├── results/
│   │   │   └── page.tsx      // Job results
│   │   └── logs/
│   │       └── page.tsx      // Job logs
│   └── create/
│       └── page.tsx          // Create new job
├── configs/
│   ├── page.tsx              // Saved configurations
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx      // Edit configuration
│   └── new/
│       └── page.tsx          // New configuration
└── settings/
    └── page.tsx              // Scraping settings
```

#### 2.2 Main Dashboard (`scraping/page.tsx`)
Following SMS dashboard pattern:

```typescript
export default function ScrapingDashboardPage() {
  // State management (following SMS pattern)
  const [stats, setStats] = useState<ScrapingStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<ScrapingJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  // Dashboard sections:
  // 1. Header with "Create Job" and "Quick Scrape" buttons
  // 2. Service status alert (if scraping service down)
  // 3. Statistics cards (Total Jobs, Active Jobs, Completed, Failed)
  // 4. Tabs: Overview, Recent Jobs, Active Jobs
  // 5. Quick actions sidebar
  // 6. System status panel
}
```

#### 2.3 Statistics Cards Component
```typescript
interface ScrapingStatsCardsProps {
  stats: ScrapingStats | null;
  loading: boolean;
}

export function ScrapingStatsCards({ stats, loading }: ScrapingStatsCardsProps) {
  // Cards for:
  // - Total Jobs
  // - Active Jobs  
  // - Completed Jobs
  // - Failed Jobs
  // - Total Pages Scraped
  // - Total Items Extracted
}
```

#### 2.4 Job Creation Form
```typescript
export default function CreateScrapingJobPage() {
  // Form sections:
  // 1. Basic Info (name, description)
  // 2. Target Configuration (URL, max pages, depth)
  // 3. Data Extraction (CSS selectors, data fields)
  // 4. Filters & Rules (content filters, exclusions)
  // 5. Schedule (one-time vs recurring)
  // 6. Advanced Settings (browser options, delays)
}
```

#### 2.5 Job Results Viewer
```typescript
export default function JobResultsPage() {
  // Features:
  // 1. Data table with extracted information
  // 2. Export buttons (CSV, JSON)
  // 3. Filtering and search
  // 4. Preview of scraped content
  // 5. Error handling for failed extractions
}
```

### 3. API Integration

#### 3.1 API Client (`/lib/api/endpoints/scraping.ts`)
```typescript
export const scrapingApi = {
  // Jobs
  createJob: (data: CreateScrapingJobDto) => 
    apiClient.post<ScrapingJob>('/scraping/jobs', data),
  getJobs: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<ScrapingJob>>('/scraping/jobs', { params }),
  getJob: (id: number) =>
    apiClient.get<ScrapingJob>(`/scraping/jobs/${id}`),
  deleteJob: (id: number) =>
    apiClient.delete(`/scraping/jobs/${id}`),
    
  // Job Control
  startJob: (id: number) =>
    apiClient.post(`/scraping/jobs/${id}/start`),
  pauseJob: (id: number) =>
    apiClient.post(`/scraping/jobs/${id}/pause`),
  cancelJob: (id: number) =>
    apiClient.post(`/scraping/jobs/${id}/cancel`),
    
  // Results
  getJobResults: (id: number, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/scraping/jobs/${id}/results`, { params }),
  exportResults: (id: number, format: 'csv' | 'json') =>
    apiClient.get(`/scraping/jobs/${id}/export?format=${format}`, { responseType: 'blob' }),
    
  // Statistics
  getStats: (subAccountId?: number) => {
    const query = subAccountId ? `?subAccountId=${subAccountId}` : '';
    return apiClient.get<ScrapingStats>(`/scraping/stats${query}`);
  },
  
  // Configuration
  saveConfig: (data: ScrapingConfigDto) =>
    apiClient.post<ScrapingConfig>('/scraping/configs', data),
  getConfigs: (subAccountId?: number) => {
    const query = subAccountId ? `?subAccountId=${subAccountId}` : '';
    return apiClient.get<ScrapingConfig[]>(`/scraping/configs${query}`);
  },
    
  // Utilities
  testUrl: (url: string) =>
    apiClient.post<{ accessible: boolean; title?: string; error?: string }>('/scraping/test-url', { url }),
  getServiceStatus: () =>
    apiClient.get<ScrapingServiceStatus>('/scraping/service-status'),
};
```

### 4. Technical Implementation Details

#### 4.1 Dependencies
**Backend:**
- `puppeteer` or `playwright` - Browser automation
- `cheerio` - HTML parsing and manipulation
- `bull` - Queue management for background jobs
- `class-validator` - DTO validation
- `sharp` - Image processing (for screenshots)

**Frontend:**
- Existing UI components from shadcn/ui
- React Query for data fetching
- Socket.io for real-time job updates

#### 4.2 Security Considerations
- Rate limiting per user/subaccount
- URL validation and sanitization
- Blocked domains list (internal networks, localhost)
- Resource limits (memory, time, pages)
- User-agent rotation
- Respect robots.txt

#### 4.3 Performance Optimizations
- Queue-based processing
- Connection pooling for browser instances
- Caching for repeated requests
- Pagination for large result sets
- Background job processing

#### 4.4 Error Handling
- Comprehensive logging
- Retry mechanisms for transient failures
- Graceful degradation for partial failures
- User-friendly error messages
- Job recovery after system restart

### 5. Integration with Existing Systems

#### 5.1 Multi-tenant Support
- All scraping jobs isolated by `subAccountId`
- Resource quotas per tenant
- Separate job queues per tenant

#### 5.2 Authentication & Authorization
- JWT authentication for all endpoints
- Role-based access control
- Job ownership validation

#### 5.3 Database Integration
- Prisma ORM for data persistence
- Transaction support for complex operations
- Soft deletes for job history

#### 5.4 Monitoring & Observability
- Health checks for scraping service
- Metrics collection (jobs per hour, success rate)
- Alert system for failed jobs
- Performance monitoring

### 6. Testing Strategy

#### 6.1 Backend Tests
- Unit tests for service methods
- Integration tests for controller endpoints
- Queue processor tests
- E2E tests for complete scraping flows

#### 6.2 Frontend Tests
- Component unit tests
- API integration tests
- User flow tests
- Accessibility tests

### 7. Deployment Considerations

#### 7.1 Infrastructure
- Separate worker processes for scraping
- Redis for queue management
- Load balancing for scraping workers
- Docker containerization

#### 7.2 Configuration
- Environment variables for service settings
- Feature flags for gradual rollout
- Rate limiting configuration
- Resource limit settings

This implementation plan follows the established patterns in the codebase while providing a comprehensive web scraping solution that integrates seamlessly with the existing CRM architecture.