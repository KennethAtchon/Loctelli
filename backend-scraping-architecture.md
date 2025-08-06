# Backend Scraping Architecture Documentation

## Overview

The scraping system is a comprehensive web scraping solution built on NestJS that allows users to create, manage, and execute web scraping jobs. It uses a queue-based architecture with Puppeteer for browser automation and Cheerio for HTML parsing.

## Architecture Components

### 1. Core Module Structure
```
src/main-app/modules/scraping/
├── scraping.module.ts          # Module configuration with Bull queue setup
├── scraping.controller.ts      # REST API endpoints
├── scraping.service.ts         # Business logic and job management
├── processors/
│   └── scraping-processor.ts   # Background job processing
├── dto/                        # Data transfer objects
│   ├── create-scraping-job.dto.ts
│   ├── update-scraping-job.dto.ts
│   └── ...
└── interfaces/                 # TypeScript interfaces
    ├── scraping-job.interface.ts
    └── scraping-result.interface.ts
```

### 2. Database Schema

The scraping system uses two main database tables:

#### ScrapingJob Table
- **Purpose**: Stores scraping job configurations and results
- **Key Fields**:
  - `id`: Primary key
  - `name`, `description`: Job identification
  - `status`: Enum (PENDING, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED)
  - `targetUrl`: URL to scrape
  - `maxPages`, `maxDepth`: Pagination limits
  - `selectors`: JSONB field with CSS selectors for data extraction
  - `filters`: JSONB field with filtering rules
  - `userAgent`, `delayMin`, `delayMax`, `timeout`: Browser configuration
  - `results`: JSONB field storing scraped data
  - `userId`, `subAccountId`: Multi-tenant isolation

#### ScrapingConfig Table
- **Purpose**: Stores reusable scraping configurations
- **Key Fields**:
  - `name`, `description`: Configuration identification
  - `config`: JSONB field with saved scraping settings
  - `userId`, `subAccountId`: Multi-tenant isolation

### 3. Queue Architecture

The system uses **Bull Queue** with Redis for background job processing:

```typescript
// Queue Configuration (scraping.module.ts:11-32)
BullModule.registerQueue({
  name: 'scraping',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 5000,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})
```

## Core Functionality

### 1. Job Lifecycle Management

#### Job Creation (scraping.service.ts:19-55)
- Validates target URL accessibility
- Creates database record with PENDING status
- Supports configuration of:
  - CSS selectors for data extraction
  - Browser settings (user agent, timeouts, delays)
  - Pagination limits
  - Filtering rules

#### Job Execution (scraping.service.ts:186-248)
- Adds job to Bull queue for background processing
- Handles queue failures and marks jobs as FAILED
- Supports retry logic with exponential backoff

#### Job Control
- **Start**: Queues job for processing
- **Pause**: Updates status to PAUSED (scraping.service.ts:251-277)
- **Cancel**: Updates status to CANCELLED and cleans up resources (scraping.service.ts:279-306)

### 2. Background Processing

#### ScrapingProcessor (processors/scraping-processor.ts)
The processor handles the actual web scraping using Puppeteer:

```typescript
@Process('scrape-website')
async handleScrapingJob(job: Job<ScrapingJobData>) {
  // 1. Launch Puppeteer browser with optimized settings
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', ...]
  });

  // 2. Navigate to target URL
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });

  // 3. Extract data using CSS selectors
  const extractedData = await this.extractDataFromPage(page, selectors, url);

  // 4. Update job progress and results
  await this.updateJobProgress(jobId, processedPages, extractedData.length, results);
}
```

#### Data Extraction Process
1. **HTML Parsing**: Uses Cheerio to parse page HTML
2. **Selector Application**: Applies user-defined CSS selectors
3. **Data Normalization**: Handles single vs. multiple elements
4. **Error Handling**: Logs selector failures and continues processing

### 3. Security Features

#### URL Validation (scraping.service.ts:493-569)
- Blocks localhost and internal network addresses
- Validates URL format and accessibility
- Tests HTTP connectivity with timeout limits
- Extracts page title for validation feedback

#### Rate Limiting
- Configurable delays between requests (delayMin/delayMax)
- Browser timeout settings
- Queue-level retry limits

## API Endpoints

### Job Management
- `POST /scraping/jobs` - Create new scraping job
- `GET /scraping/jobs` - List jobs (paginated, filterable by status)
- `GET /scraping/jobs/:id` - Get specific job details
- `PUT /scraping/jobs/:id` - Update job configuration
- `DELETE /scraping/jobs/:id` - Delete job

### Job Control
- `POST /scraping/jobs/:id/start` - Start/resume job
- `POST /scraping/jobs/:id/pause` - Pause running job
- `POST /scraping/jobs/:id/cancel` - Cancel job

### Results & Monitoring
- `GET /scraping/jobs/:id/results` - Get job results (paginated)
- `GET /scraping/jobs/:id/export` - Export results (CSV/JSON)
- `GET /scraping/jobs/:id/preview` - Preview limited results
- `GET /scraping/jobs/:id/status` - Real-time job status
- `GET /scraping/jobs/:id/logs` - Job execution logs
- `GET /scraping/stats` - User scraping statistics
- `GET /scraping/dashboard` - Consolidated dashboard data

### Configuration Management
- `POST /scraping/configs` - Save scraping configuration
- `GET /scraping/configs` - List saved configurations
- `PUT /scraping/configs/:id` - Update configuration (TODO)
- `DELETE /scraping/configs/:id` - Delete configuration (TODO)

### Validation & Testing
- `POST /scraping/test-url` - Test URL accessibility
- `POST /scraping/validate-selectors` - Validate CSS selectors (TODO)
- `GET /scraping/service-status` - Check scraping service health

## Multi-Tenant Architecture

The scraping system supports multi-tenancy through:

- **SubAccount Isolation**: All jobs are isolated by `subAccountId`
- **User-Level Access**: Jobs are further restricted by `userId`
- **Database Constraints**: Foreign key relationships ensure data integrity
- **API Authentication**: JWT guards with role-based access control

## Performance Optimizations

### Database
- Optimized queries with proper indexing
- Paginated result sets
- Single-query statistics calculation (scraping.service.ts:379-451)

### Queue Management
- Job cleanup (removeOnComplete: 10, removeOnFail: 5)
- Connection pooling and timeouts
- Exponential backoff for retries

### Browser Optimization
- Headless Puppeteer with minimal resource usage
- Viewport optimization (1280x720)
- Network idle detection for page load completion

### Dashboard Performance
- Parallel API calls for dashboard data (scraping.controller.ts:370-375)
- Service status with timeout protection (scraping.controller.ts:378-384)

## Error Handling & Monitoring

### Job-Level Error Handling
- Browser failure cleanup and resource management
- Detailed error logging with stack traces
- Graceful degradation on partial failures
- Progress preservation on unexpected stops

### Service Health Monitoring
- Queue status monitoring (length, active workers)
- Memory usage tracking
- Error rate calculation
- Service availability checks with fallbacks

### Logging Strategy
- Structured logging with contextual information
- Job lifecycle events (start, progress, completion)
- Error categorization and stack trace preservation
- Performance metrics (processing time, success rates)

## Current Limitations & TODOs

### Implementation Gaps
1. **Multi-page Scraping**: Currently only scrapes single pages (scraping-processor.ts:94-95)
2. **Selector Validation**: Mock implementation needs real validation (scraping.service.ts:574-588)
3. **Configuration Management**: Update/delete operations not implemented
4. **Scheduling**: Cron-based recurring jobs not implemented
5. **Advanced Filtering**: Filter rules application not implemented

### Scalability Considerations
1. **Horizontal Scaling**: Queue workers can be distributed across multiple instances
2. **Resource Management**: Browser instance pooling not implemented
3. **Storage Optimization**: Large result sets stored directly in database
4. **Rate Limiting**: Per-domain rate limiting not implemented

## Technical Dependencies

### Core Technologies
- **NestJS**: Framework and dependency injection
- **Puppeteer**: Headless Chrome automation
- **Cheerio**: Server-side jQuery-like HTML parsing
- **Bull Queue**: Redis-based job queue management
- **Prisma ORM**: Database interaction and migrations

### Infrastructure Requirements
- **PostgreSQL**: Primary database for job storage
- **Redis**: Queue backend and caching
- **Node.js**: Runtime environment
- **Chrome/Chromium**: Browser engine for Puppeteer

## Security Considerations

### Access Control
- JWT-based authentication on all endpoints
- Multi-tenant data isolation
- Role-based permission system
- User-level job ownership validation

### Scraping Safety
- Internal network blocking (localhost, RFC 1918 addresses)
- Request timeout enforcement
- Resource usage limits (memory, page count)
- User-agent rotation support

### Data Protection
- Sensitive data not logged in error messages
- Secure cookie handling for authentication
- Input validation on all endpoints
- SQL injection prevention through Prisma ORM

This architecture provides a robust, scalable foundation for web scraping with proper error handling, security measures, and multi-tenant support, while maintaining clear separation of concerns between job management, execution, and monitoring.