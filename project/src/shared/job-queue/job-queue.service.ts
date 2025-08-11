import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Queue from 'bee-queue';
import { JobProcessor } from './interfaces/job-processor.interface';
import { JobData, JobType } from './interfaces/job-data.interface';
import { JobResultDto } from './dto/job-result.dto';
import { EmailProcessor } from './processors/email-processor';
import { SmsProcessor } from './processors/sms-processor';
import { DataExportProcessor } from './processors/data-export-processor';
import { GenericTaskProcessor } from './processors/generic-task-processor';

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
    private genericTaskProcessor: GenericTaskProcessor,
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
    
    // bee-queue uses node_redis, not ioredis - need to parse URL for Railway compatibility
    let redisConnection;
    if (redisConfig.url) {
      // Parse Redis URL to extract components for node_redis compatibility
      const url = new URL(redisConfig.url);
      redisConnection = {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || redisConfig.password,
        db: redisConfig.db || 0,
        family: 'IPv4', // node_redis uses 'IPv4'/'IPv6', try IPv4 first
      };
    } else {
      redisConnection = {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        family: 'IPv4',
      };
    }
    
    const queueSettings = {
      removeOnSuccess: true, // Remove successful jobs
      removeOnFailure: false, // Keep failed jobs for debugging
      redis: redisConnection,
    };

    // Initialize queues for different job types
    const jobTypes: JobType[] = ['email', 'sms', 'data-export', 'file-processing', 'generic-task'];
    
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
    this.processors.set('generic-task', this.genericTaskProcessor);

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
    
    // Note: bee-queue doesn't support priority in the same way
    // Priority would be handled by using different queues or other mechanisms

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

      const status = this.mapJobStatus(job.status as string);
      
      return {
        jobId,
        status,
        progress: (job as any).progress || 0,
        result: job.status === 'succeeded' ? (job as any).returnvalue : null,
        error: job.status === 'failed' ? (job as any).stacktrace : null,
        createdAt: new Date((job as any).created_at || Date.now()),
        completedAt: job.status === 'succeeded' || job.status === 'failed' 
          ? new Date((job as any).processed_on || Date.now()) 
          : undefined,
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

  private mapJobStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'not_found' | 'error' {
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
        return 'error';
    }
  }

  /**
   * Execute any function in the background
   */
  async executeTask(
    taskName: string,
    functionName: string,
    parameters: any[] = [],
    options?: {
      subAccountId?: string;
      userId?: string;
      context?: Record<string, any>;
      delay?: number;
      retries?: number;
    }
  ): Promise<string> {
    const jobData = {
      taskName,
      functionName,
      parameters,
      subAccountId: options?.subAccountId || 'system',
      userId: options?.userId,
      context: options?.context,
      metadata: {
        taskType: 'standalone-function',
        executedBy: 'job-queue',
      },
    };

    return this.addJob('generic-task', jobData, {
      delay: options?.delay,
      retries: options?.retries || 1,
    });
  }

  /**
   * Execute a service method in the background
   */
  async executeServiceMethod(
    taskName: string,
    serviceName: string,
    methodName: string,
    parameters: any[] = [],
    options?: {
      subAccountId?: string;
      userId?: string;
      context?: Record<string, any>;
      delay?: number;
      retries?: number;
    }
  ): Promise<string> {
    const jobData = {
      taskName,
      functionName: methodName,
      serviceName,
      parameters,
      subAccountId: options?.subAccountId || 'system',
      userId: options?.userId,
      context: options?.context,
      metadata: {
        taskType: 'service-method',
        executedBy: 'job-queue',
      },
    };

    return this.addJob('generic-task', jobData, {
      delay: options?.delay,
      retries: options?.retries || 1,
    });
  }

  private async closeQueues() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}