import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
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
  private workers = new Map<JobType, Worker>();
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
    
    // BullMQ connection configuration with Railway IPv6 compatibility
    let connectionConfig;
    if (redisConfig.url) {
      const redisURL = new URL(redisConfig.url);
      connectionConfig = {
        family: 0, // Enable dual-stack DNS resolution for Railway
        host: redisURL.hostname,
        port: parseInt(redisURL.port) || 6379,
        username: redisURL.username || 'default',
        password: redisURL.password || redisConfig.password,
        db: redisConfig.db || 0,
        maxRetriesPerRequest: null, // Disable eviction policy warnings
      };
    } else {
      connectionConfig = {
        family: 0, // Enable dual-stack DNS resolution
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        maxRetriesPerRequest: null, // Disable eviction policy warnings
      };
    }
    
    const defaultJobOptions = {
      removeOnComplete: 10, // Keep last 10 successful jobs
      removeOnFail: 50, // Keep last 50 failed jobs for debugging
    };

    // Initialize queues for different job types
    const jobTypes: JobType[] = ['email', 'sms', 'data-export', 'file-processing', 'generic-task'];
    
    for (const type of jobTypes) {
      const queue = new Queue(`${type}-queue`, {
        connection: connectionConfig,
        defaultJobOptions,
      });
      this.queues.set(type, queue);
      
      queue.on('error', (err) => {
        this.logger.error(`❌ ${type} queue error:`, err);
      });
      
      this.logger.log(`📊 ${type} queue initialized`);
    }
  }

  private registerProcessors() {
    const redisConfig = this.configService.get('redis');
    
    // BullMQ connection configuration
    let connectionConfig;
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
    } else {
      connectionConfig = {
        family: 0,
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
      };
    }

    // Register processors for each job type
    this.processors.set('email', this.emailProcessor);
    this.processors.set('sms', this.smsProcessor);
    this.processors.set('data-export', this.dataExportProcessor);
    this.processors.set('generic-task', this.genericTaskProcessor);

    // Set up BullMQ workers
    this.queues.forEach((queue, type) => {
      const processor = this.processors.get(type);
      if (processor) {
        const worker = new Worker(`${type}-queue`, async (job) => {
          this.logger.log(`🔄 Processing ${type} job ${job.id}`);
          try {
            const result = await processor.process(job.data);
            this.logger.log(`✅ ${type} job ${job.id} completed`);
            return result;
          } catch (error) {
            this.logger.error(`❌ ${type} job ${job.id} failed:`, error);
            throw error;
          }
        }, {
          connection: connectionConfig,
          concurrency: 5,
        });
        
        this.workers.set(type, worker);
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

    const jobOptions: any = {};
    
    if (options?.delay) {
      jobOptions.delay = options.delay;
    }
    
    if (options?.retries) {
      jobOptions.attempts = options.retries;
    }
    
    if (options?.priority) {
      jobOptions.priority = options.priority;
    }

    const job = await queue.add(`${type}-job`, data, jobOptions);
    this.logger.log(`📤 ${type} job ${job.id} queued`);
    
    return job.id!;
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

      const status = this.mapBullMQJobStatus(await job.getState());
      
      return {
        jobId,
        status,
        progress: job.progress as number || 0,
        result: job.returnvalue || null,
        error: job.failedReason || null,
        createdAt: new Date(job.timestamp),
        completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
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

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      succeeded: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  private mapBullMQJobStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'not_found' | 'error' {
    switch (status) {
      case 'waiting':
      case 'delayed':
        return 'pending';
      case 'active':
        return 'processing';
      case 'completed':
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
    // Close workers first
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    
    // Then close queues
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}