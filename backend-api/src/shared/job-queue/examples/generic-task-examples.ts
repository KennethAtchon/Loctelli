import { Injectable, Controller, Post, Body, Get, Param } from '@nestjs/common';
import { JobQueueService } from '../job-queue.service';

/**
 * Examples showing how to use the generic task execution feature
 */

@Controller('example/generic-tasks')
export class GenericTaskExamplesController {
  constructor(private jobQueueService: JobQueueService) {}

  // Example 1: Execute built-in utility functions
  @Post('delay-task')
  async scheduleDelayTask(@Body() { delay }: { delay: number }) {
    const jobId = await this.jobQueueService.executeTask(
      'Delay Test',
      'delay',
      [delay], // Parameters: [milliseconds]
      {
        subAccountId: 'sub_123',
        userId: 'user_456',
      },
    );

    return {
      message: `Delay task scheduled for ${delay}ms`,
      jobId,
    };
  }

  // Example 2: Process data in background
  @Post('process-data')
  async processData(
    @Body() { data, operation }: { data: any[]; operation: string },
  ) {
    const jobId = await this.jobQueueService.executeTask(
      'Data Processing',
      'processData',
      [data, operation], // Parameters
      {
        subAccountId: 'sub_123',
        context: {
          filterKey: 'status',
          filterValue: 'active',
        },
      },
    );

    return {
      message: 'Data processing started',
      jobId,
      operation,
      recordCount: data.length,
    };
  }

  // Example 3: Execute service method in background
  @Post('export-leads-async')
  async exportLeadsAsync(
    @Body() { subAccountId, format }: { subAccountId: string; format: string },
  ) {
    const jobId = await this.jobQueueService.executeServiceMethod(
      'Background Lead Export',
      'LeadsService', // Service name
      'exportLeads', // Method name
      [subAccountId, format], // Parameters
      {
        subAccountId,
        retries: 2,
        delay: 5000, // 5 second delay
      },
    );

    return {
      message: 'Lead export started in background',
      jobId,
      format,
    };
  }

  // Example 4: Custom notification task
  @Post('send-notifications')
  async sendNotifications(
    @Body()
    {
      type,
      recipients,
      message,
    }: {
      type: string;
      recipients: string[];
      message: string;
    },
  ) {
    const jobId = await this.jobQueueService.executeTask(
      'Send Notifications',
      'sendNotification',
      [type, recipients, message],
      {
        subAccountId: 'sub_123',
        context: {
          priority: 'high',
          campaign: 'holiday-2024',
        },
      },
    );

    return {
      message: 'Notifications queued for sending',
      jobId,
      recipientCount: recipients.length,
    };
  }

  // Example 5: Scheduled cleanup task
  @Post('cleanup-old-data')
  async cleanupOldData(
    @Body() { tableName, daysOld }: { tableName: string; daysOld: number },
  ) {
    const jobId = await this.jobQueueService.executeTask(
      'Data Cleanup',
      'cleanupOldData',
      [tableName, daysOld],
      {
        subAccountId: 'system',
        delay: 60000, // 1 minute delay
        retries: 3,
        context: {
          backupBefore: true,
          notifyAdmin: true,
        },
      },
    );

    return {
      message: `Cleanup scheduled for ${tableName} (${daysOld} days old)`,
      jobId,
    };
  }

  // Example 6: Generate reports
  @Post('generate-report')
  async generateReport(
    @Body() { reportType, filters }: { reportType: string; filters: any },
  ) {
    const jobId = await this.jobQueueService.executeTask(
      'Report Generation',
      'generateReport',
      [reportType, filters],
      {
        subAccountId: 'sub_123',
        context: {
          outputFormat: 'pdf',
          emailWhenDone: true,
        },
      },
    );

    return {
      message: `${reportType} report generation started`,
      jobId,
    };
  }

  // Check task status
  @Get('status/:jobId')
  async getTaskStatus(@Param('jobId') jobId: string) {
    return this.jobQueueService.getJobStatus('generic-task', jobId);
  }
}

// Service Examples - showing how services can use generic tasks internally
@Injectable()
export class ExampleBusinessService {
  constructor(private jobQueueService: JobQueueService) {}

  async triggerBackgroundProcessing(userId: string, data: any[]) {
    // Process large datasets in background
    const jobId = await this.jobQueueService.executeTask(
      'User Data Processing',
      'processData',
      [data, 'transform'],
      {
        subAccountId: 'sub_123',
        userId,
        context: {
          source: 'user-upload',
          transformType: 'normalize',
        },
      },
    );

    return { jobId, message: 'Processing started' };
  }

  async scheduleMaintenanceTasks() {
    const tasks: string[] = [];

    // Schedule multiple maintenance tasks
    tasks.push(
      await this.jobQueueService.executeTask(
        'Clean temp files',
        'cleanupOldData',
        ['temp_files', 7],
        { delay: 300000 }, // 5 minutes
      ),
    );

    tasks.push(
      await this.jobQueueService.executeTask(
        'Generate daily report',
        'generateReport',
        ['daily_activity', { date: new Date().toISOString().split('T')[0] }],
        { delay: 600000 }, // 10 minutes
      ),
    );

    return {
      message: 'Maintenance tasks scheduled',
      taskIds: tasks,
    };
  }

  async processUserAction(userId: string, action: string, payload: any) {
    // Execute any custom business logic in background
    return this.jobQueueService.executeTask(
      `User Action: ${action}`,
      'customAsyncTask',
      [`user_${userId}_${action}`, payload],
      {
        subAccountId: 'sub_123',
        userId,
        context: {
          action,
          timestamp: new Date(),
          source: 'user-interface',
        },
      },
    );
  }

  // Execute methods from other services in background
  async triggerEmailCampaign(campaignId: string, recipients: string[]) {
    return this.jobQueueService.executeServiceMethod(
      'Email Campaign',
      'EmailService',
      'sendBulkEmail',
      [campaignId, recipients],
      {
        retries: 2,
        context: { source: 'campaign-scheduler' },
      },
    );
  }

  async syncDataWithExternalAPI(endpoint: string, data: any) {
    return this.jobQueueService.executeServiceMethod(
      'External API Sync',
      'IntegrationService',
      'syncWithAPI',
      [endpoint, data],
      {
        retries: 3,
        delay: 10000, // 10 second delay
        context: {
          syncType: 'bidirectional',
          priority: 'normal',
        },
      },
    );
  }
}

/**
 * Usage Patterns:
 *
 * 1. Built-in Functions:
 *    - delay, calculateSum, processData, sendNotification
 *    - cleanupOldData, generateReport, customAsyncTask
 *
 * 2. Service Methods:
 *    - Any method from any injectable service
 *    - Full dependency injection support
 *
 * 3. Custom Functions:
 *    - Add to task registry in GenericTaskProcessor
 *    - Access via executeTask()
 *
 * 4. Flexible Parameters:
 *    - Pass any parameters as array
 *    - Additional context via options.context
 *
 * 5. Full Background Execution:
 *    - Immediate response with jobId
 *    - Monitor via getJobStatus()
 *    - Built-in retry and error handling
 */
