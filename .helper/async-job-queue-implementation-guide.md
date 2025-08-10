# Async Job Queue Implementation Guide

## Overview

This guide explains how to implement a Redis-based job queue system using `bee-queue` in your NestJS backend. The job queue will execute background tasks without blocking synchronous API calls, allowing for better performance and user experience.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Endpoint  │───▶│   Job Queue     │───▶│  Worker Process │
│   (Controller)  │    │   (Redis)       │    │   (Background)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                       │
                                │                       ▼
                                └───────────────────────┘
                                   Job Status Updates
```

## Prerequisites

✅ Redis is already configured in your project  
✅ `bee-queue` dependency is already installed  
✅ Shared module structure exists  

## Implementation Steps

### 1. Create Job Queue Module in `/shared`

Create the job queue infrastructure in your shared directory:

```bash
# Directory structure to create:
project/src/shared/
├── job-queue/
│   ├── job-queue.module.ts
│   ├── job-queue.service.ts
│   ├── processors/
│   │   ├── base-processor.ts
│   │   ├── email-processor.ts
│   │   ├── sms-processor.ts
│   │   └── data-export-processor.ts
│   ├── dto/
│   │   ├── job-result.dto.ts
│   │   └── job-status.dto.ts
│   └── interfaces/
│       ├── job-processor.interface.ts
│       └── job-data.interface.ts
```

### 2. Job Queue Module (`shared/job-queue/job-queue.module.ts`)

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobQueueService } from './job-queue.service';
import { EmailProcessor } from './processors/email-processor';
import { SmsProcessor } from './processors/sms-processor';
import { DataExportProcessor } from './processors/data-export-processor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    JobQueueService,
    EmailProcessor,
    SmsProcessor,
    DataExportProcessor,
  ],
  exports: [JobQueueService],
})
export class JobQueueModule {}
```

### 3. Job Queue Service (`shared/job-queue/job-queue.service.ts`)

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Queue from 'bee-queue';
import { JobProcessor } from './interfaces/job-processor.interface';
import { JobData, JobType } from './interfaces/job-data.interface';
import { JobResultDto } from './dto/job-result.dto';
import { EmailProcessor } from './processors/email-processor';
import { SmsProcessor } from './processors/sms-processor';
import { DataExportProcessor } from './processors/data-export-processor';

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private queues = new Map<JobType, Queue>();
  private processors = new Map<JobType, JobProcessor>();

  constructor(
    private configService: ConfigService,
    private emailProcessor: EmailProcessor,
    private smsProcessor: SmsProcessor,
    private dataExportProcessor: DataExportProcessor,
  ) {}

  async onModuleInit() {
    await this.initializeQueues();
    this.registerProcessors();
    this.logger.log('✅ Job Queue Service initialized');
  }

  async onModuleDestroy() {
    await this.closeQueues();
    this.logger.log('🔒 Job Queue Service closed');
  }

  private async initializeQueues() {
    const redisConfig = this.configService.get('redis');
    const queueSettings = {
      removeOnSuccess: 10, // Keep last 10 successful jobs
      removeOnFailure: 50, // Keep last 50 failed jobs
      redis: redisConfig.url || {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
      },
    };

    // Initialize queues for different job types
    const jobTypes: JobType[] = ['email', 'sms', 'data-export', 'file-processing'];
    
    for (const type of jobTypes) {
      const queue = new Queue(`${type}-queue`, queueSettings);
      this.queues.set(type, queue);
      
      queue.on('ready', () => {
        this.logger.log(`📊 ${type} queue ready`);
      });
      
      queue.on('error', (err) => {
        this.logger.error(`❌ ${type} queue error:`, err);
      });
    }
  }

  private registerProcessors() {
    // Register processors for each job type
    this.processors.set('email', this.emailProcessor);
    this.processors.set('sms', this.smsProcessor);
    this.processors.set('data-export', this.dataExportProcessor);

    // Set up queue processors
    this.queues.forEach((queue, type) => {
      const processor = this.processors.get(type);
      if (processor) {
        queue.process(async (job) => {
          this.logger.log(`🔄 Processing ${type} job ${job.id}`);
          try {
            const result = await processor.process(job.data);
            this.logger.log(`✅ ${type} job ${job.id} completed`);
            return result;
          } catch (error) {
            this.logger.error(`❌ ${type} job ${job.id} failed:`, error);
            throw error;
          }
        });
      }
    });
  }

  /**
   * Add a job to the queue
   */
  async addJob<T extends JobData>(
    type: JobType,
    data: T,
    options?: {
      delay?: number;
      retries?: number;
      priority?: number;
    }
  ): Promise<string> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue for type ${type} not found`);
    }

    const job = queue.createJob(data);
    
    if (options?.delay) {
      job.delayUntil(Date.now() + options.delay);
    }
    
    if (options?.retries) {
      job.retries(options.retries);
    }
    
    if (options?.priority) {
      job.priority(options.priority);
    }

    await job.save();
    this.logger.log(`📤 ${type} job ${job.id} queued`);
    
    return job.id.toString();
  }

  /**
   * Get job status
   */
  async getJobStatus(type: JobType, jobId: string): Promise<JobResultDto> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue for type ${type} not found`);
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return { status: 'not_found', jobId };
      }

      return {
        jobId,
        status: this.mapJobStatus(job.status),
        progress: job.progress,
        result: job.status === 'succeeded' ? job.result : null,
        error: job.status === 'failed' ? job.error : null,
        createdAt: new Date(job.created),
        completedAt: job.ended ? new Date(job.ended) : null,
      };
    } catch (error) {
      this.logger.error(`Error getting job status for ${jobId}:`, error);
      return { status: 'error', jobId, error: error.message };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(type: JobType) {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue for type ${type} not found`);
    }

    const health = await queue.checkHealth();
    return {
      waiting: health.waiting,
      active: health.active,
      succeeded: health.succeeded,
      failed: health.failed,
      delayed: health.delayed,
      newestJob: health.newestJob,
    };
  }

  private mapJobStatus(status: string): string {
    switch (status) {
      case 'created':
      case 'retrying':
        return 'pending';
      case 'active':
        return 'processing';
      case 'succeeded':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'unknown';
    }
  }

  private async closeQueues() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}
```

### 4. Interfaces and DTOs

**Job Data Interface (`shared/job-queue/interfaces/job-data.interface.ts`):**

```typescript
export type JobType = 'email' | 'sms' | 'data-export' | 'file-processing';

export interface BaseJobData {
  subAccountId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EmailJobData extends BaseJobData {
  to: string[];
  subject: string;
  template: string;
  templateData?: Record<string, any>;
}

export interface SmsJobData extends BaseJobData {
  phoneNumbers: string[];
  message: string;
  campaignId?: string;
}

export interface DataExportJobData extends BaseJobData {
  exportType: 'leads' | 'bookings' | 'contacts';
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  columns?: string[];
}

export type JobData = EmailJobData | SmsJobData | DataExportJobData;
```

**Job Processor Interface (`shared/job-queue/interfaces/job-processor.interface.ts`):**

```typescript
import { JobData } from './job-data.interface';

export interface JobProcessor {
  process(data: JobData): Promise<any>;
}
```

**Job Result DTO (`shared/job-queue/dto/job-result.dto.ts`):**

```typescript
export class JobResultDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found' | 'error';
  progress?: number;
  result?: any;
  error?: any;
  createdAt?: Date;
  completedAt?: Date;
}
```

### 5. Example Processor Implementation

**SMS Processor (`shared/job-queue/processors/sms-processor.ts`):**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { JobProcessor } from '../interfaces/job-processor.interface';
import { SmsJobData } from '../interfaces/job-data.interface';
import { SmsService } from '../../sms/sms.service';

@Injectable()
export class SmsProcessor implements JobProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(private smsService: SmsService) {}

  async process(data: SmsJobData): Promise<any> {
    this.logger.log(`📱 Processing SMS job for ${data.phoneNumbers.length} numbers`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const phoneNumber of data.phoneNumbers) {
      try {
        const result = await this.smsService.sendSms(
          phoneNumber,
          data.message,
          data.subAccountId
        );
        results.push({ phoneNumber, status: 'sent', messageId: result.id });
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
        results.push({ phoneNumber, status: 'failed', error: error.message });
        failCount++;
      }
    }

    const summary = {
      total: data.phoneNumbers.length,
      successful: successCount,
      failed: failCount,
      results,
    };

    this.logger.log(`✅ SMS job completed: ${successCount}/${data.phoneNumbers.length} sent`);
    return summary;
  }
}
```

### 6. Usage Examples

**In Controllers:**

```typescript
import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { JobQueueService } from '../shared/job-queue/job-queue.service';
import { SmsJobData } from '../shared/job-queue/interfaces/job-data.interface';

@Controller('sms')
export class SmsController {
  constructor(private jobQueueService: JobQueueService) {}

  @Post('bulk-send')
  async bulkSendSms(@Body() data: SmsJobData) {
    // Queue the SMS job instead of processing synchronously
    const jobId = await this.jobQueueService.addJob('sms', data, {
      retries: 3,
      priority: 1
    });

    return {
      success: true,
      message: 'SMS campaign queued for processing',
      jobId,
      // User will refresh to see results
    };
  }

  @Get('job-status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.jobQueueService.getJobStatus('sms', jobId);
  }

  @Get('queue-stats')
  async getQueueStats() {
    return this.jobQueueService.getQueueStats('sms');
  }
}
```

**In Services (for internal job creation):**

```typescript
@Injectable()
export class LeadsService {
  constructor(private jobQueueService: JobQueueService) {}

  async exportLeads(subAccountId: string, format: 'csv' | 'excel') {
    // Queue export job instead of blocking the request
    const jobId = await this.jobQueueService.addJob('data-export', {
      subAccountId,
      exportType: 'leads',
      format,
      metadata: { requestedBy: 'user-123' }
    });

    return { jobId, status: 'queued' };
  }
}
```

### 7. Update Shared Module

Add the JobQueueModule to your SharedModule:

```typescript
// shared/shared.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { StorageModule } from './storage/storage.module';
import { SmsModule } from './sms/sms.module';
import { JobQueueModule } from './job-queue/job-queue.module'; // Add this

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
    StorageModule,
    SmsModule,
    JobQueueModule, // Add this
  ],
  exports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
    StorageModule,
    SmsModule,
    JobQueueModule, // Add this
  ],
})
export class SharedModule {}
```

### 8. Configuration Updates

Add job queue configuration to your config:

```typescript
// shared/config/configuration.ts
export default () => ({
  // ... existing config
  jobQueue: {
    removeOnSuccess: parseInt(process.env.QUEUE_REMOVE_ON_SUCCESS || '10', 10),
    removeOnFailure: parseInt(process.env.QUEUE_REMOVE_ON_FAILURE || '50', 10),
    defaultRetries: parseInt(process.env.QUEUE_DEFAULT_RETRIES || '3', 10),
    maxConcurrency: parseInt(process.env.QUEUE_MAX_CONCURRENCY || '10', 10),
  },
});
```

## Benefits

### 1. **Non-blocking Operations**
- API responses are immediate
- Heavy operations run in background
- Better user experience

### 2. **Reliability**
- Jobs persist in Redis
- Automatic retries on failure
- Error handling and logging

### 3. **Scalability**
- Process jobs across multiple workers
- Queue-based load balancing
- Horizontal scaling capability

### 4. **Monitoring**
- Job status tracking
- Queue statistics
- Performance metrics

## Usage Patterns

### 1. **Immediate Response Pattern**
```typescript
// Controller responds immediately with job ID
const jobId = await this.jobQueueService.addJob('data-export', exportData);
return { message: 'Export started', jobId, status: 'processing' };
```

### 2. **Status Polling Pattern**
```typescript
// Frontend polls for job status
const status = await this.jobQueueService.getJobStatus('data-export', jobId);
// User refreshes page to see updated status
```

### 3. **Batch Processing Pattern**
```typescript
// Process large datasets in chunks
for (const chunk of chunks) {
  await this.jobQueueService.addJob('sms', chunk, { delay: index * 1000 });
}
```

## Best Practices

1. **Job Data Size**: Keep job data small, store large data in database with ID reference
2. **Error Handling**: Always implement proper error handling in processors
3. **Progress Updates**: Update job progress for long-running tasks
4. **Cleanup**: Configure `removeOnSuccess` and `removeOnFailure` appropriately
5. **Monitoring**: Log job starts, completions, and failures
6. **Resource Management**: Close queues properly on module destroy

## Testing

```typescript
// In your test files
describe('JobQueueService', () => {
  it('should queue SMS job successfully', async () => {
    const jobId = await jobQueueService.addJob('sms', mockSmsData);
    expect(jobId).toBeDefined();
    
    const status = await jobQueueService.getJobStatus('sms', jobId);
    expect(status.status).toBe('pending');
  });
});
```

## Monitoring and Debugging

1. **Redis CLI**: Monitor queue state directly
   ```bash
   docker exec -it loctelli_redis redis-cli
   KEYS *queue*
   ```

2. **Queue Health**: Check queue statistics endpoint
3. **Logs**: Monitor application logs for job processing
4. **Failed Jobs**: Review failed jobs for debugging

This implementation provides a robust, scalable job queue system that integrates seamlessly with your existing NestJS architecture while maintaining the "refresh to see results" user experience you specified.