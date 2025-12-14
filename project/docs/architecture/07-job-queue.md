# Job Queue System

## Purpose
Documentation of the background job processing system using BullMQ and Redis.

## 1. Overview

### Job Queue Architecture

The job queue system provides **asynchronous background processing** using BullMQ (Redis-backed) for handling time-consuming tasks without blocking the main application thread.

**Key Components**:
- **BullMQ**: Redis-based job queue library
- **Redis**: Message broker and job storage
- **Workers**: Background processes that execute jobs
- **Processors**: Job-specific processing logic
- **Service Registry**: Enables cross-module service method execution

### BullMQ Integration

**Package**: `bullmq` (v5.63.0)

**Features**:
- Redis-backed queues
- Automatic retry logic
- Job status tracking
- Priority queues
- Delayed jobs
- Job progress tracking
- Worker concurrency control

### Redis Connection

**Configuration**:
- Connection via Redis URL or host/port
- Dual-stack DNS resolution (IPv4/IPv6) for Railway compatibility
- Connection retry logic
- Database selection support

**Connection Options**:
```typescript
{
  family: 0,              // Dual-stack DNS
  host: string,
  port: number,
  username?: string,
  password?: string,
  db: number,
  maxRetriesPerRequest: null  // Disable eviction warnings
}
```

### Job Types

**Supported Types**:
- `email` - Email sending jobs
- `sms` - SMS sending jobs
- `data-export` - Data export jobs (CSV, Excel, PDF)
- `file-processing` - File processing jobs
- `generic-task` - Generic background tasks (service methods, functions)

### Architecture Diagram

```mermaid
graph TB
    subgraph "Application Layer"
        CONTROLLER[Controller]
        SERVICE[Service]
    end
    
    subgraph "Job Queue Layer"
        JOB_QUEUE[JobQueueService]
        QUEUE_EMAIL[Email Queue]
        QUEUE_SMS[SMS Queue]
        QUEUE_EXPORT[Export Queue]
        QUEUE_GENERIC[Generic Queue]
    end
    
    subgraph "Redis"
        REDIS[(Redis)]
    end
    
    subgraph "Worker Layer"
        WORKER_EMAIL[Email Worker]
        WORKER_SMS[SMS Worker]
        WORKER_EXPORT[Export Worker]
        WORKER_GENERIC[Generic Worker]
    end
    
    subgraph "Processor Layer"
        PROCESSOR_EMAIL[EmailProcessor]
        PROCESSOR_SMS[SMSProcessor]
        PROCESSOR_EXPORT[DataExportProcessor]
        PROCESSOR_GENERIC[GenericTaskProcessor]
    end
    
    subgraph "Service Registry"
        REGISTRY[ServiceRegistry]
    end
    
    subgraph "External Services"
        SMS_SERVICE[SmsService]
        EMAIL_SERVICE[EmailService]
    end
    
    CONTROLLER --> SERVICE
    SERVICE --> JOB_QUEUE
    JOB_QUEUE --> QUEUE_EMAIL
    JOB_QUEUE --> QUEUE_SMS
    JOB_QUEUE --> QUEUE_EXPORT
    JOB_QUEUE --> QUEUE_GENERIC
    
    QUEUE_EMAIL --> REDIS
    QUEUE_SMS --> REDIS
    QUEUE_EXPORT --> REDIS
    QUEUE_GENERIC --> REDIS
    
    REDIS --> WORKER_EMAIL
    REDIS --> WORKER_SMS
    REDIS --> WORKER_EXPORT
    REDIS --> WORKER_GENERIC
    
    WORKER_EMAIL --> PROCESSOR_EMAIL
    WORKER_SMS --> PROCESSOR_SMS
    WORKER_EXPORT --> PROCESSOR_EXPORT
    WORKER_GENERIC --> PROCESSOR_GENERIC
    
    PROCESSOR_SMS --> SMS_SERVICE
    PROCESSOR_EMAIL --> EMAIL_SERVICE
    PROCESSOR_GENERIC --> REGISTRY
    REGISTRY --> SERVICE
```

## 2. JobQueueService

### Service Initialization

**Location**: `src/shared/job-queue/job-queue.service.ts`

**Lifecycle Hooks**:
- `onModuleInit()` - Initialize queues and register processors
- `onModuleDestroy()` - Close workers and queues gracefully

**Initialization Flow**:
1. Initialize Redis connection
2. Create queues for each job type
3. Register processors
4. Start workers
5. Set up error handlers

### Queue Management

**Queue Creation**:
```typescript
const queue = new Queue(`${type}-queue`, {
  connection: connectionConfig,
  defaultJobOptions: {
    removeOnComplete: 10,  // Keep last 10 successful jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
  }
});
```

**Queue Types**:
- `email-queue`
- `sms-queue`
- `data-export-queue`
- `file-processing-queue`
- `generic-task-queue`

### Worker Management

**Worker Creation**:
```typescript
const worker = new Worker(
  `${type}-queue`,
  async (job) => {
    const result = await processor.process(job.data);
    return result;
  },
  {
    connection: connectionConfig,
    concurrency: 5,  // Process 5 jobs concurrently
  }
);
```

**Worker Features**:
- Automatic job processing
- Error handling
- Retry logic
- Progress tracking
- Concurrency control

### Processor Registration

**Registration**:
```typescript
this.processors.set('email', this.emailProcessor);
this.processors.set('sms', this.smsProcessor);
this.processors.set('data-export', this.dataExportProcessor);
this.processors.set('generic-task', this.genericTaskProcessor);
```

**Processor Interface**:
```typescript
interface JobProcessor {
  process(data: JobData): Promise<any>;
}
```

### Connection Configuration

**Redis URL Parsing**:
```typescript
if (redisConfig.url) {
  const redisURL = new URL(redisConfig.url);
  connectionConfig = {
    family: 0,  // Dual-stack DNS for Railway
    host: redisURL.hostname,
    port: parseInt(redisURL.port) || 6379,
    username: redisURL.username || 'default',
    password: redisURL.password || redisConfig.password,
    db: redisConfig.db || 0,
    maxRetriesPerRequest: null,
  };
}
```

**Railway Compatibility**:
- `family: 0` enables dual-stack DNS resolution
- Supports both IPv4 and IPv6 connections
- Handles Railway's IPv6 infrastructure

## 3. Job Types

### Email Jobs

**Type**: `email`

**Data Structure**:
```typescript
interface EmailJobData {
  subAccountId: string;
  userId?: string;
  to: string[];
  subject: string;
  template: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

**Usage**:
```typescript
await jobQueueService.addJob('email', {
  subAccountId: '1',
  to: ['user@example.com'],
  subject: 'Welcome',
  template: 'welcome-email',
  templateData: { name: 'John' }
});
```

**Status**: Placeholder implementation (TODO: integrate with email service)

### SMS Jobs

**Type**: `sms`

**Data Structure**:
```typescript
interface SmsJobData {
  subAccountId: string;
  userId?: string;
  phoneNumbers: string[];
  message: string;
  campaignId?: string;
  metadata?: Record<string, any>;
}
```

**Usage**:
```typescript
await jobQueueService.addJob('sms', {
  subAccountId: '1',
  phoneNumbers: ['+1234567890'],
  message: 'Hello from Loctelli!'
});
```

**Implementation**: Uses `SmsService` for actual sending

### Data Export Jobs

**Type**: `data-export`

**Data Structure**:
```typescript
interface DataExportJobData {
  subAccountId: string;
  userId?: string;
  exportType: 'leads' | 'bookings' | 'users';
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  columns?: string[];
  metadata?: Record<string, any>;
}
```

**Usage**:
```typescript
await jobQueueService.addJob('data-export', {
  subAccountId: '1',
  exportType: 'leads',
  format: 'csv',
  filters: { status: 'qualified' },
  columns: ['id', 'name', 'email', 'phone']
});
```

**Supported Exports**:
- Leads export
- Bookings export
- Users export

**Formats**:
- CSV (implemented)
- Excel (TODO)
- PDF (TODO)

### File Processing Jobs

**Type**: `file-processing`

**Status**: Queue created but processor not implemented

**Future Use Cases**:
- Image processing
- Document conversion
- File compression
- Batch file operations

### Generic Task Jobs

**Type**: `generic-task`

**Data Structure**:
```typescript
interface GenericTaskJobData {
  subAccountId: string;
  userId?: string;
  taskName: string;
  functionName: string;
  serviceName?: string;  // If executing service method
  parameters: any[];
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

**Usage**:
```typescript
// Execute service method
await jobQueueService.executeServiceMethod(
  'Sync Contacts',
  'ContactsService',
  'syncWithGHL',
  [integrationId],
  { subAccountId: '1' }
);

// Execute standalone function
await jobQueueService.executeTask(
  'Generate Report',
  'generateReport',
  ['leads', { status: 'qualified' }],
  { subAccountId: '1' }
);
```

**Features**:
- Execute any service method in background
- Execute standalone functions
- Service Registry pattern for cross-module calls
- No circular dependencies

## 4. Job Processors

### EmailProcessor

**Location**: `src/shared/job-queue/processors/email-processor.ts`

**Purpose**: Process email sending jobs

**Implementation**:
```typescript
async process(data: EmailJobData): Promise<any> {
  const results = [];
  for (const recipient of data.to) {
    try {
      // TODO: Implement actual email sending
      await this.simulateEmailSend(recipient, data.subject, data.template);
      results.push({ recipient, status: 'sent' });
    } catch (error) {
      results.push({ recipient, status: 'failed', error: error.message });
    }
  }
  return { total: data.to.length, successful, failed, results };
}
```

**Status**: Placeholder (simulates email sending)

### SMSProcessor

**Location**: `src/shared/job-queue/processors/sms-processor.ts`

**Purpose**: Process SMS sending jobs

**Implementation**:
```typescript
async process(data: SmsJobData): Promise<any> {
  const results = [];
  for (const phoneNumber of data.phoneNumbers) {
    try {
      const result = await this.smsService.sendSms(phoneNumber, data.message);
      results.push({ phoneNumber, status: 'sent', messageId: result.messageId });
    } catch (error) {
      results.push({ phoneNumber, status: 'failed', error: error.message });
    }
  }
  return { total, successful, failed, results };
}
```

**Features**:
- Uses `SmsService` for actual sending
- Batch processing
- Error handling per recipient
- Result tracking

### DataExportProcessor

**Location**: `src/shared/job-queue/processors/data-export-processor.ts`

**Purpose**: Process data export jobs

**Implementation**:
```typescript
async process(data: DataExportJobData): Promise<any> {
  let exportData: any[];
  
  switch (data.exportType) {
    case 'leads':
      exportData = await this.exportLeads(data);
      break;
    case 'bookings':
      exportData = await this.exportBookings(data);
      break;
    case 'users':
      exportData = await this.exportUsers(data);
      break;
  }
  
  const formattedData = await this.formatData(exportData, data.format);
  return { exportType, format, filename, recordCount, data: formattedData };
}
```

**Features**:
- Tenant-scoped data export
- Filter support
- Column selection
- Multiple formats (CSV implemented, Excel/PDF TODO)

### GenericTaskProcessor

**Location**: `src/shared/job-queue/processors/generic-task-processor.ts`

**Purpose**: Execute generic tasks (service methods or functions)

**Implementation**:
```typescript
async process(data: GenericTaskJobData): Promise<any> {
  if (data.serviceName) {
    // Execute service method via registry
    return await this.executeServiceMethod(data);
  } else {
    // Execute standalone function
    return await this.executeStandaloneFunction(data);
  }
}
```

**Features**:
- Service Registry integration
- Standalone function execution
- Cross-module service calls
- No circular dependencies

### Base Processor Pattern

**Location**: `src/shared/job-queue/processors/base-processor.ts`

**Purpose**: Abstract base class for all processors

**Methods**:
- `process()` - Abstract method to implement
- `logStart()` - Log job start
- `logSuccess()` - Log job success
- `logError()` - Log job error

**Usage**:
```typescript
export class MyProcessor extends BaseProcessor {
  async process(data: JobData): Promise<any> {
    this.logStart('MyJob', data);
    // Process job
    this.logSuccess('MyJob', result);
    return result;
  }
}
```

## 5. Job Data Interface

### JobData Interface

**Base Interface**:
```typescript
interface BaseJobData {
  subAccountId: string;
  userId?: string;
  metadata?: Record<string, any>;
}
```

**Type-Specific Interfaces**:
- `EmailJobData extends BaseJobData`
- `SmsJobData extends BaseJobData`
- `DataExportJobData extends BaseJobData`
- `GenericTaskJobData extends BaseJobData`

**Union Type**:
```typescript
type JobData = EmailJobData | SmsJobData | DataExportJobData | GenericTaskJobData;
```

### JobType Enum

**Values**:
```typescript
type JobType =
  | 'email'
  | 'sms'
  | 'data-export'
  | 'file-processing'
  | 'generic-task';
```

### Job Payload Structure

**Common Fields**:
- `subAccountId` - Tenant identifier (required)
- `userId` - User who initiated job (optional)
- `metadata` - Additional metadata (optional)

**Type-Specific Fields**:
- Email: `to`, `subject`, `template`, `templateData`
- SMS: `phoneNumbers`, `message`, `campaignId`
- Export: `exportType`, `format`, `filters`, `columns`
- Generic: `taskName`, `functionName`, `serviceName`, `parameters`, `context`

### Job Metadata

**Purpose**: Store additional context about the job

**Common Metadata**:
```typescript
{
  taskType: 'service-method' | 'standalone-function',
  executedBy: 'job-queue',
  source: 'api' | 'scheduled' | 'webhook',
  // ... custom fields
}
```

## 6. Job Execution

### Job Submission

**Method**: `addJob<T extends JobData>()`

**Parameters**:
- `type: JobType` - Job type
- `data: T` - Job data
- `options?: { delay?, retries?, priority? }` - Job options

**Returns**: `Promise<string>` - Job ID

**Example**:
```typescript
const jobId = await jobQueueService.addJob('sms', {
  subAccountId: '1',
  phoneNumbers: ['+1234567890'],
  message: 'Hello!'
}, {
  delay: 5000,      // Delay 5 seconds
  retries: 3,       // Retry 3 times on failure
  priority: 10     // Higher priority
});
```

### Job Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant JobQueueService
    participant Queue
    participant Redis
    participant Worker
    participant Processor
    participant ExternalService

    Client->>JobQueueService: addJob(type, data, options)
    JobQueueService->>Queue: queue.add(jobName, data, options)
    Queue->>Redis: Store job
    Redis-->>Queue: Job stored
    Queue-->>JobQueueService: Job ID
    JobQueueService-->>Client: Job ID
    
    Redis->>Worker: Job available
    Worker->>Worker: Fetch job
    Worker->>Processor: process(job.data)
    Processor->>ExternalService: Execute task
    ExternalService-->>Processor: Result
    Processor-->>Worker: Result
    Worker->>Redis: Update job status (completed)
    Worker->>Redis: Store result
    
    Client->>JobQueueService: getJobStatus(type, jobId)
    JobQueueService->>Queue: queue.getJob(jobId)
    Queue->>Redis: Get job
    Redis-->>Queue: Job with status
    Queue-->>JobQueueService: Job status
    JobQueueService-->>Client: Status & result
```

### Job Status Tracking

**Status Values**:
- `pending` - Waiting to be processed
- `processing` - Currently being processed
- `completed` - Successfully completed
- `failed` - Failed after retries
- `not_found` - Job not found
- `error` - Error retrieving status

**Status Mapping**:
```typescript
BullMQ Status → Our Status
'waiting' → 'pending'
'delayed' → 'pending'
'active' → 'processing'
'completed' → 'completed'
'failed' → 'failed'
```

### Job Result Handling

**Result Structure**:
```typescript
{
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found' | 'error';
  progress?: number;
  result?: any;
  error?: any;
  createdAt?: Date;
  completedAt?: Date;
}
```

**Retrieval**:
```typescript
const status = await jobQueueService.getJobStatus('sms', jobId);
console.log(status.status);      // 'completed'
console.log(status.result);       // Job result
console.log(status.progress);     // 100
```

### Job Retry Logic

**Configuration**:
- Default retries: 3 (configurable)
- Retry delay: Exponential backoff (BullMQ default)
- Max retries: Configurable per job

**Retry Options**:
```typescript
await jobQueueService.addJob('email', data, {
  retries: 5  // Retry 5 times on failure
});
```

**Retry Behavior**:
- Automatic retry on failure
- Exponential backoff between retries
- Failed after max retries → status: 'failed'

## 7. Queue Configuration

### Queue Options

**Default Options**:
```typescript
{
  removeOnComplete: 10,  // Keep last 10 successful jobs
  removeOnFail: 50,      // Keep last 50 failed jobs
}
```

**Configuration Source**:
```typescript
// From environment or config
jobQueue: {
  removeOnSuccess: 10,
  removeOnFailure: 50,
  defaultRetries: 3,
  maxConcurrency: 5
}
```

### Job Options

**Available Options**:
- `delay` - Delay job execution (milliseconds)
- `retries` - Number of retry attempts
- `priority` - Job priority (higher = processed first)
- `removeOnComplete` - Remove job after completion
- `removeOnFail` - Remove job after failure

**Example**:
```typescript
await jobQueueService.addJob('sms', data, {
  delay: 10000,        // Delay 10 seconds
  retries: 3,          // Retry 3 times
  priority: 100        // High priority
});
```

### Retry Configuration

**Default**: 3 retries

**Per-Job Override**:
```typescript
await jobQueueService.addJob('email', data, {
  retries: 5  // Override default
});
```

**Retry Strategy**: Exponential backoff (BullMQ default)

### Job Retention

**Successful Jobs**:
- Keep last 10 by default
- Configurable via `removeOnComplete`
- Older jobs automatically removed

**Failed Jobs**:
- Keep last 50 by default
- Configurable via `removeOnFail`
- Useful for debugging

### Priority Queues

**Priority Levels**:
- Higher number = higher priority
- Jobs with higher priority processed first
- Default priority: 0

**Usage**:
```typescript
// High priority job
await jobQueueService.addJob('sms', urgentData, { priority: 100 });

// Normal priority job
await jobQueueService.addJob('sms', normalData, { priority: 0 });
```

## 8. Worker Configuration

### Worker Options

**Configuration**:
```typescript
{
  connection: connectionConfig,
  concurrency: 5,  // Process 5 jobs concurrently
}
```

**Concurrency**:
- Default: 5 jobs per worker
- Configurable per worker type
- Prevents resource exhaustion

### Concurrency Settings

**Per-Queue Concurrency**:
- Email: 5 concurrent jobs
- SMS: 5 concurrent jobs
- Export: 5 concurrent jobs
- Generic: 5 concurrent jobs

**Adjustment**:
```typescript
const worker = new Worker(queueName, processor, {
  concurrency: 10  // Increase concurrency
});
```

### Worker Lifecycle

**Initialization**:
1. Worker created on module init
2. Connected to Redis
3. Starts listening for jobs
4. Ready to process jobs

**Shutdown**:
1. Stop accepting new jobs
2. Finish processing current jobs
3. Close Redis connection
4. Cleanup resources

**Code**:
```typescript
async onModuleDestroy() {
  // Close workers first
  for (const worker of this.workers.values()) {
    await worker.close();
  }
  
  // Then close queues
  for (const queue of this.queues.values()) {
    await queue.close();
  }
}
```

### Worker Error Handling

**Error Handling**:
```typescript
worker.on('failed', (job, err) => {
  this.logger.error(`Job ${job.id} failed:`, err);
  // Job will be retried if retries configured
});

worker.on('error', (err) => {
  this.logger.error('Worker error:', err);
  // Worker-level error (connection, etc.)
});
```

**Job Failure**:
- Error logged
- Job retried if retries configured
- Status updated to 'failed' after max retries

## 9. Job Status & Results

### JobResultDto

**Structure**:
```typescript
class JobResultDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found' | 'error';
  progress?: number;
  result?: any;
  error?: any;
  createdAt?: Date;
  completedAt?: Date;
}
```

### JobResultDto Fields

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | `string` | Unique job identifier |
| `status` | `string` | Current job status |
| `progress` | `number?` | Progress percentage (0-100) |
| `result` | `any?` | Job result (if completed) |
| `error` | `any?` | Error message (if failed) |
| `createdAt` | `Date?` | Job creation timestamp |
| `completedAt` | `Date?` | Job completion timestamp |

### Status Tracking

**Status Updates**:
- `pending` - Job queued, waiting
- `processing` - Job being processed
- `completed` - Job finished successfully
- `failed` - Job failed after retries
- `not_found` - Job not found
- `error` - Error retrieving status

**Progress Tracking**:
```typescript
// In processor
job.updateProgress(50);  // 50% complete
```

### Result Retrieval

**Method**: `getJobStatus(type, jobId)`

**Returns**: `JobResultDto`

**Example**:
```typescript
const status = await jobQueueService.getJobStatus('sms', jobId);

if (status.status === 'completed') {
  console.log('Result:', status.result);
} else if (status.status === 'failed') {
  console.error('Error:', status.error);
}
```

## 10. Error Handling

### Failed Job Handling

**Automatic Handling**:
- Job retried if retries configured
- Error logged
- Status updated after max retries

**Manual Handling**:
```typescript
worker.on('failed', async (job, err) => {
  // Custom error handling
  await notifyAdmin(job, err);
  await logToDatabase(job, err);
});
```

### Error Logging

**Logging Levels**:
- `log` - Job start/completion
- `error` - Job failure
- `warn` - Retry attempts

**Log Format**:
```
🔄 Processing sms job abc123
✅ sms job abc123 completed
❌ sms job abc123 failed: Connection timeout
```

### Job Retry Strategies

**Default Strategy**: Exponential backoff

**Retry Configuration**:
```typescript
await jobQueueService.addJob('email', data, {
  retries: 3,  // Retry 3 times
  // BullMQ handles exponential backoff automatically
});
```

**Custom Retry** (Future):
- Custom retry delays
- Conditional retries
- Retry on specific errors only

### Dead Letter Queue

**Status**: Not implemented

**Future Implementation**:
- Failed jobs after max retries → Dead letter queue
- Manual review and reprocessing
- Alert on dead letter queue growth

## 11. Redis Configuration

### Connection Setup

**Configuration Sources**:
1. Redis URL: `redis://user:pass@host:port/db`
2. Individual fields: `host`, `port`, `password`, `db`

**URL Parsing**:
```typescript
if (redisConfig.url) {
  const redisURL = new URL(redisConfig.url);
  connectionConfig = {
    family: 0,
    host: redisURL.hostname,
    port: parseInt(redisURL.port) || 6379,
    username: redisURL.username || 'default',
    password: redisURL.password || redisConfig.password,
    db: redisConfig.db || 0,
  };
}
```

### Railway IPv6 Compatibility

**Issue**: Railway uses IPv6 infrastructure

**Solution**: `family: 0` enables dual-stack DNS resolution

**Configuration**:
```typescript
{
  family: 0,  // Enable IPv4 and IPv6
  // ... other config
}
```

**Benefits**:
- Works with IPv4-only Redis
- Works with IPv6-only Railway
- Automatic protocol selection

### Connection Retry Logic

**BullMQ Built-in**:
- Automatic reconnection
- Connection pooling
- Health checks

**Configuration**:
```typescript
{
  maxRetriesPerRequest: null,  // Disable eviction warnings
  // BullMQ handles retries automatically
}
```

### Connection Health Checks

**Monitoring**:
- Queue error events
- Worker error events
- Connection status

**Error Handling**:
```typescript
queue.on('error', (err) => {
  this.logger.error('Queue error:', err);
  // BullMQ will attempt reconnection
});
```

## 12. Usage Examples

### Adding Email Job

```typescript
const jobId = await jobQueueService.addJob('email', {
  subAccountId: '1',
  userId: '123',
  to: ['user@example.com'],
  subject: 'Welcome to Loctelli',
  template: 'welcome-email',
  templateData: {
    name: 'John Doe',
    company: 'Acme Corp'
  }
}, {
  delay: 5000,  // Send after 5 seconds
  retries: 3
});

console.log('Email job queued:', jobId);
```

### Adding SMS Job

```typescript
const jobId = await jobQueueService.addJob('sms', {
  subAccountId: '1',
  phoneNumbers: ['+1234567890', '+0987654321'],
  message: 'Hello from Loctelli!',
  campaignId: 'campaign-123'
}, {
  priority: 100  // High priority
});

// Check status
const status = await jobQueueService.getJobStatus('sms', jobId);
console.log('Status:', status.status);
```

### Adding Data Export Job

```typescript
const jobId = await jobQueueService.addJob('data-export', {
  subAccountId: '1',
  exportType: 'leads',
  format: 'csv',
  filters: {
    status: 'qualified',
    createdAt: { gte: new Date('2024-01-01') }
  },
  columns: ['id', 'name', 'email', 'phone', 'status']
});

// Wait for completion
let status;
do {
  await new Promise(resolve => setTimeout(resolve, 1000));
  status = await jobQueueService.getJobStatus('data-export', jobId);
} while (status.status === 'pending' || status.status === 'processing');

if (status.status === 'completed') {
  console.log('Export completed:', status.result);
}
```

### Adding Generic Task

```typescript
// Execute service method
const jobId = await jobQueueService.executeServiceMethod(
  'Sync GHL Contacts',
  'GhlService',
  'syncContacts',
  [integrationId],
  {
    subAccountId: '1',
    userId: '123'
  }
);

// Execute standalone function
const jobId = await jobQueueService.executeTask(
  'Generate Report',
  'generateReport',
  ['leads', { status: 'qualified' }],
  {
    subAccountId: '1',
    delay: 10000  // Delay 10 seconds
  }
);
```

### Checking Job Status

```typescript
// Get job status
const status = await jobQueueService.getJobStatus('sms', jobId);

switch (status.status) {
  case 'pending':
    console.log('Job is waiting to be processed');
    break;
  case 'processing':
    console.log(`Job is ${status.progress}% complete`);
    break;
  case 'completed':
    console.log('Job completed:', status.result);
    break;
  case 'failed':
    console.error('Job failed:', status.error);
    break;
}

// Get queue statistics
const stats = await jobQueueService.getQueueStats('sms');
console.log('Queue stats:', stats);
// { waiting: 5, active: 2, succeeded: 100, failed: 3, delayed: 1 }
```

## 13. Monitoring & Debugging

### Job Monitoring

**Queue Statistics**:
```typescript
const stats = await jobQueueService.getQueueStats('sms');
// Returns: { waiting, active, succeeded, failed, delayed }
```

**Job Status**:
```typescript
const status = await jobQueueService.getJobStatus('sms', jobId);
// Returns: JobResultDto with status, progress, result, error
```

### Queue Metrics

**Available Metrics**:
- Waiting jobs count
- Active jobs count
- Completed jobs count
- Failed jobs count
- Delayed jobs count

**Usage**:
```typescript
const stats = await jobQueueService.getQueueStats('email');
console.log(`${stats.waiting} jobs waiting`);
console.log(`${stats.active} jobs processing`);
console.log(`${stats.succeeded} jobs completed`);
console.log(`${stats.failed} jobs failed`);
```

### Debug Endpoints

**Status**: Not implemented

**Future Endpoints**:
- `GET /api/admin/job-queue/stats` - All queue statistics
- `GET /api/admin/job-queue/jobs/:id` - Job details
- `GET /api/admin/job-queue/jobs` - List jobs
- `POST /api/admin/job-queue/jobs/:id/retry` - Retry failed job
- `DELETE /api/admin/job-queue/jobs/:id` - Cancel job

### Logging

**Log Levels**:
- `log` - Job lifecycle events
- `error` - Job failures
- `warn` - Retry attempts

**Log Format**:
```
📤 sms job abc123 queued
🔄 Processing sms job abc123
✅ sms job abc123 completed
❌ sms job abc123 failed: Connection timeout
```

**Log Context**:
- Job type
- Job ID
- Job status
- Error details (if failed)

---

**Status:** ✅ Complete - Ready for Review
