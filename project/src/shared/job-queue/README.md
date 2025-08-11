# Job Queue Implementation

## Overview

This is a complete implementation of a Redis-based job queue system using `BullMQ` in your NestJS backend, featuring a **Service Registry** pattern for dynamic service method execution.

## Features

- ✅ Redis-based job queue using `BullMQ`
- ✅ Multiple job types: `email`, `sms`, `data-export`, `file-processing`, `generic-task`
- ✅ **Generic task execution - run ANY function/method in background**
- ✅ **Service Registry pattern for cross-module service calls**
- ✅ Background job processing with workers
- ✅ Job status tracking and monitoring
- ✅ Error handling and retry logic
- ✅ Queue statistics and health monitoring
- ✅ Modular processor architecture
- ✅ Dynamic service method execution without circular dependencies

## Architecture

### Service Registry Pattern

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FinderModule  │    │ ServiceRegistry  │    │ JobQueueModule  │
│                 │    │   (Singleton)    │    │                 │
│ ┌─────────────┐ │    │                  │    │ ┌─────────────┐ │
│ │BusinessFinder│─┼────┼─► register()    │    │ │GenericTask  │ │
│ │   Service   │ │    │                  │    │ │ Processor   │─┼──┐
│ └─────────────┘ │    │  ┌────────────┐  │    │ └─────────────┘ │  │
│                 │    │  │  Methods   │  │◄───┼─────────────────┼──┘
│ ┌─────────────┐ │    │  │ Registry   │  │    │                 │
│ │   Other     │─┼────┼─►│            │  │    │                 │
│ │ Services    │ │    │  └────────────┘  │    │                 │
│ └─────────────┘ │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Job Processing Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Endpoint  │───▶│   Job Queue     │───▶│  Worker Process │
│   (Controller)  │    │   (BullMQ)      │    │   (Background)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                       │
                                │                       ▼
                                └───────────────────────┘
                                   Job Status Updates
```

## Directory Structure

```
src/shared/job-queue/
├── job-queue.module.ts          # Main module
├── job-queue.service.ts         # Core service (BullMQ)
├── service-registry.ts          # Service Registry singleton
├── processors/
│   ├── base-processor.ts        # Abstract base processor
│   ├── email-processor.ts       # Email job processor
│   ├── sms-processor.ts         # SMS job processor
│   ├── data-export-processor.ts # Data export processor
│   └── generic-task-processor.ts # Generic task processor (uses registry)
├── dto/
│   ├── job-result.dto.ts        # Job result data structure
│   └── job-status.dto.ts        # Job status data structure
├── interfaces/
│   ├── job-data.interface.ts    # Job data types
│   └── job-processor.interface.ts # Processor interface
└── examples/
    └── job-queue-usage.controller.example.ts # Usage examples
```

## Usage

### 1. Service Registry Pattern (NEW!)

The job queue now uses a **Service Registry** pattern to execute service methods across modules without circular dependencies.

#### How It Works

1. **Services register themselves** when their modules initialize
2. **Job processor looks up methods** in the registry instead of using DI
3. **No circular dependencies** between job queue and business logic modules

#### Registering Services

```typescript
// In your module (e.g., finder.module.ts)
import { OnModuleInit } from '@nestjs/common';
import { ServiceRegistry } from '../../../shared/job-queue/service-registry';

export class FinderModule implements OnModuleInit {
  constructor(private businessFinderService: BusinessFinderService) {}

  onModuleInit() {
    const registry = ServiceRegistry.getInstance();
    
    // Register services with specific methods that can be called via jobs
    registry.registerService('BusinessFinderService', this.businessFinderService, [
      'searchBusinesses',
      'searchBusinessesAsync',
      'getSearchResult'
    ]);
  }
}
```

#### Available Registered Services

Currently registered services and their callable methods:

- **BusinessFinderService**: `searchBusinesses`, `searchBusinessesAsync`, `getSearchResult`, `getUserSearchHistory`
- **GooglePlacesService**: `searchBusinesses`  
- **YelpService**: `searchBusinesses`
- **OpenStreetMapService**: `searchBusinesses`
- **ExportService**: `exportResults`

### 2. Generic Task Execution

**Execute registered service methods in background:**

```typescript
// Execute ANY registered service method in background
const searchJobId = await this.jobQueueService.executeServiceMethod(
  'Business Search',
  'BusinessFinderService',  // service name (must be registered)
  'searchBusinesses',       // method name (must be registered)
  [searchDto, userId], // parameters
  {
    retries: 3,
    delay: 2000 // 2 second delay
  }
);

// Execute export job
const exportJobId = await this.jobQueueService.executeServiceMethod(
  'Data Export',
  'ExportService',
  'exportResults', 
  [results, 'csv', { includeHeaders: true }],
  { retries: 1 }
);
```

**Execute built-in utility functions:**

```typescript
// Execute built-in utility functions
const jobId = await this.jobQueueService.executeTask(
  'Data Processing',
  'processData',
  [myData, 'transform'], // parameters
  {
    subAccountId: 'sub_123',
    userId: 'user_456',
    context: { source: 'user-upload' }
  }
);
```

**Built-in functions available:**
- `delay(ms)` - Simple delay/wait
- `calculateSum(numbers)` - Math operations
- `processData(data, operation, context)` - Data processing
- `sendNotification(type, recipients, message, context)` - Notifications
- `cleanupOldData(tableName, daysOld, context)` - Data cleanup
- `generateReport(type, filters, context)` - Report generation
- `customAsyncTask(taskId, data, context)` - Custom logic

### 3. Injecting the Service

```typescript
import { JobQueueService } from '../shared/job-queue/job-queue.service';

@Controller('sms')
export class SmsController {
  constructor(private jobQueueService: JobQueueService) {}
}
```

### 4. Queuing Jobs

```typescript
// Queue SMS job
const jobId = await this.jobQueueService.addJob('sms', {
  subAccountId: 'sub_123',
  phoneNumbers: ['+1234567890'],
  message: 'Hello from job queue!',
}, {
  retries: 3,
  delay: 5000 // 5 second delay
});

// Queue data export job
const exportJobId = await this.jobQueueService.addJob('data-export', {
  subAccountId: 'sub_123',
  exportType: 'leads',
  format: 'csv',
  filters: { status: 'active' }
});
```

### 5. Checking Job Status

```typescript
const status = await this.jobQueueService.getJobStatus('sms', jobId);
console.log(status);
// {
//   jobId: "123",
//   status: "completed",
//   result: { total: 1, successful: 1, failed: 0, results: [...] },
//   createdAt: "2024-01-01T00:00:00Z",
//   completedAt: "2024-01-01T00:00:30Z"
// }
```

### 6. Queue Statistics

```typescript
const stats = await this.jobQueueService.getQueueStats('sms');
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   succeeded: 100,
//   failed: 3,
//   delayed: 1
// }
```

## Job Types

### SMS Jobs
```typescript
interface SmsJobData {
  subAccountId: string;
  phoneNumbers: string[];
  message: string;
  campaignId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}
```

### Email Jobs (Placeholder)
```typescript
interface EmailJobData {
  subAccountId: string;
  to: string[];
  subject: string;
  template: string;
  templateData?: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}
```

### Data Export Jobs
```typescript
interface DataExportJobData {
  subAccountId: string;
  exportType: 'leads' | 'bookings' | 'users';
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  columns?: string[];
  userId?: string;
  metadata?: Record<string, any>;
}
```

## Configuration

The system uses the existing Redis configuration from your `shared/config/configuration.ts` and adds job queue specific settings:

```typescript
jobQueue: {
  removeOnSuccess: 10,    // Keep last 10 successful jobs
  removeOnFailure: 50,    // Keep last 50 failed jobs
  defaultRetries: 3,      // Default retry attempts
  maxConcurrency: 10,     // Max concurrent jobs
}
```

## Environment Variables

```bash
# Redis (already configured)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Job Queue (optional)
QUEUE_REMOVE_ON_SUCCESS=10
QUEUE_REMOVE_ON_FAILURE=50
QUEUE_DEFAULT_RETRIES=3
QUEUE_MAX_CONCURRENCY=10
```

## Integration

The job queue is automatically integrated into your existing architecture:

1. **SharedModule**: The `JobQueueModule` is included in `shared.module.ts`
2. **Global Module**: The module is marked as `@Global()`, making it available throughout the app
3. **Dependencies**: Automatically injects `SmsService`, `PrismaService`, etc.

## Monitoring

### Development
```bash
# Monitor Redis queues
docker exec -it loctelli_redis redis-cli
KEYS *queue*
```

### Production
- Check queue health via API endpoints
- Monitor application logs for job processing
- Use Redis monitoring tools

## Status Response Patterns

### Immediate Response Pattern
```typescript
// Controller responds immediately
const jobId = await this.jobQueueService.addJob('sms', smsData);
return { 
  message: 'SMS campaign queued', 
  jobId, 
  status: 'processing' 
};
```

### Status Polling Pattern
```typescript
// Frontend can poll for updates
const status = await this.jobQueueService.getJobStatus('sms', jobId);
// User refreshes page to see updated status
```

## Quick Start Examples

### Basic SMS Campaign
```typescript
@Controller('campaigns')
export class CampaignsController {
  constructor(private jobQueueService: JobQueueService) {}

  @Post('sms/send')
  async sendSmsCampaign(@Body() body: { phoneNumbers: string[], message: string, subAccountId: string }) {
    const jobId = await this.jobQueueService.addJob('sms', {
      subAccountId: body.subAccountId,
      phoneNumbers: body.phoneNumbers,
      message: body.message,
      userId: 'current-user-id'
    });

    return { 
      success: true, 
      message: 'SMS campaign started', 
      jobId,
      checkStatusAt: `/api/jobs/sms/${jobId}/status`
    };
  }
}
```

### Background Data Processing
```typescript
// Execute any service method in background
async processLargeDataset(data: any[], subAccountId: string) {
  const jobId = await this.jobQueueService.executeServiceMethod(
    'Large Dataset Processing',
    'DataProcessingService',
    'processDataset',
    [data, { batchSize: 1000 }],
    { 
      subAccountId,
      retries: 2,
      delay: 1000 // 1 second delay
    }
  );
  
  return { jobId, estimatedTime: '5-10 minutes' };
}
```

### Custom Background Tasks
```typescript
// Built-in utility functions
const cleanupJobId = await this.jobQueueService.executeTask(
  'Database Cleanup',
  'cleanupOldData',
  ['leads', 30], // table name, days old
  { subAccountId: 'sub_123' }
);

// Custom async operations
const reportJobId = await this.jobQueueService.executeTask(
  'Monthly Report',
  'generateReport', 
  ['monthly', { year: 2024, month: 12 }],
  { 
    subAccountId: 'sub_123',
    context: { reportType: 'analytics' }
  }
);
```

## Frontend Integration

### Status Checking Component
```typescript
// React/Next.js component example
const useJobStatus = (jobType: string, jobId: string) => {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      const response = await fetch(`/api/jobs/${jobType}/${jobId}/status`);
      const result = await response.json();
      setStatus(result);
      
      // Refresh every 5 seconds if still processing
      if (result.status === 'processing' || result.status === 'pending') {
        setTimeout(checkStatus, 5000);
      }
    };
    
    checkStatus();
  }, [jobType, jobId]);
  
  return status;
};
```

## API Endpoints Pattern

### Standard Job Status Routes
```typescript
@Controller('jobs')
export class JobsController {
  constructor(private jobQueueService: JobQueueService) {}

  @Get(':type/:jobId/status')
  async getJobStatus(@Param('type') type: string, @Param('jobId') jobId: string) {
    return this.jobQueueService.getJobStatus(type as JobType, jobId);
  }

  @Get(':type/stats')
  async getQueueStats(@Param('type') type: string) {
    return this.jobQueueService.getQueueStats(type as JobType);
  }
}
```

## Common Use Cases

### 1. Bulk Email/SMS Campaigns
- **Problem**: Sending to 10,000+ contacts blocks the API
- **Solution**: Queue job, return immediately with job ID
- **User Experience**: Shows "Campaign started, check results in 10 minutes"

### 2. Data Exports
- **Problem**: Large CSV/Excel exports timeout requests
- **Solution**: Background generation with download link
- **User Experience**: "Export ready" notification + download button

### 3. File Processing
- **Problem**: Image resizing, video conversion blocks uploads
- **Solution**: Process files asynchronously after upload
- **User Experience**: Upload completes, processing happens behind scenes

### 4. AI Integration Tasks
- **Problem**: ChatGPT API calls are slow and can timeout
- **Solution**: Queue AI processing jobs
- **User Experience**: "AI is thinking..." with periodic status updates

## Troubleshooting

### Common Issues

1. **Service Not Found Errors**
   ```
   Service method 'BusinessFinderService.searchBusinesses' not found in registry
   ```
   **Solution**: 
   - Ensure the service module implements `OnModuleInit`
   - Check that the service is registered with correct method names
   - Verify the module is imported in the application

2. **Method Not Found Warnings**
   ```
   Method exportToCSV not found on service ExportService
   ```
   **Solution**: 
   - Check the actual method names in the service class
   - Only register public methods that should be callable via jobs
   - Update the registration with correct method names

3. **Jobs Stuck in Pending**
   ```bash
   # Check Redis connection
   docker exec -it loctelli_redis redis-cli ping
   
   # Check queue health
   docker exec -it loctelli_redis redis-cli KEYS "*queue*"
   ```

4. **High Memory Usage**
   - Completed jobs are automatically removed
   - Failed jobs are kept for debugging (configure `removeOnFailure`)

5. **Slow Processing**
   - Check `maxConcurrency` setting
   - Monitor Redis memory usage
   - Consider job batching for large datasets

### Service Registry Debugging

```typescript
// Check what services are registered
const registry = ServiceRegistry.getInstance();
console.log('Registered services:', registry.getRegisteredServices());

// Check methods for a specific service
console.log('BusinessFinderService methods:', 
  registry.getServiceMethods('BusinessFinderService'));
```

### Debug Commands
```bash
# Monitor all job queues
docker exec -it loctelli_redis redis-cli --scan --pattern "*queue*"

# Check active jobs
docker exec -it loctelli_redis redis-cli LLEN "sms-queue:active"

# View failed jobs
docker exec -it loctelli_redis redis-cli LLEN "sms-queue:failed"
```

## Next Steps

1. **Email Integration**: Implement actual email sending in `EmailProcessor`
2. **File Processing**: Add file processing capabilities  
3. **Advanced Monitoring**: Add metrics collection and alerts
4. **UI Components**: Create frontend components for job status monitoring
5. **Webhook Support**: Add webhook notifications for job completion
6. **AI Context**: Add AI-powered job queue optimization and insights
7. **Auto-Registration**: Add decorator-based service registration (`@JobQueueService()`)
8. **Type Safety**: Add TypeScript interfaces for registered service methods

## Implementation Notes

- The system follows the "refresh to see results" UX pattern as specified
- Jobs are processed asynchronously without blocking API responses
- Failed jobs are retained for debugging while successful jobs are cleaned up
- All processors follow the same base interface for consistency
- The implementation is fully typed with TypeScript for better developer experience
- Generic task execution allows ANY function to run in background
- **Service Registry pattern eliminates circular dependency issues**
- **Services maintain their original dependency injection context**
- **Only explicitly registered methods are callable via job queue for security**
- **BullMQ provides better performance and reliability than bee-queue**