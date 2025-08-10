import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { JobQueueService } from '../job-queue.service';
import { SmsJobData, DataExportJobData, EmailJobData } from '../interfaces/job-data.interface';

/**
 * Example controller demonstrating how to use the JobQueueService
 * This is an example file - not meant to be used directly in production
 */
@Controller('example/jobs')
export class JobQueueExampleController {
  constructor(private jobQueueService: JobQueueService) {}

  @Post('sms/bulk-send')
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

  @Post('email/bulk-send')
  async bulkSendEmail(@Body() data: EmailJobData) {
    // Queue the email job
    const jobId = await this.jobQueueService.addJob('email', data, {
      retries: 2,
      priority: 2
    });

    return {
      success: true,
      message: 'Email campaign queued for processing',
      jobId,
    };
  }

  @Post('data-export')
  async exportData(@Body() data: DataExportJobData) {
    // Queue the data export job
    const jobId = await this.jobQueueService.addJob('data-export', data, {
      retries: 1,
      priority: 3
    });

    return {
      success: true,
      message: 'Data export queued for processing',
      jobId,
    };
  }

  @Get('status/:type/:jobId')
  async getJobStatus(@Param('type') type: string, @Param('jobId') jobId: string) {
    return this.jobQueueService.getJobStatus(type as any, jobId);
  }

  @Get('stats/:type')
  async getQueueStats(@Param('type') type: string) {
    return this.jobQueueService.getQueueStats(type as any);
  }
}

// Example usage in services
export class ExampleService {
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

  async sendBulkSms(phoneNumbers: string[], message: string, subAccountId: string) {
    const jobId = await this.jobQueueService.addJob('sms', {
      subAccountId,
      phoneNumbers,
      message,
      metadata: { source: 'bulk-campaign' }
    });

    return { jobId, status: 'queued' };
  }
}