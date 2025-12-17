import { Logger } from '@nestjs/common';
import { JobProcessor } from '../interfaces/job-processor.interface';
import { JobData } from '../interfaces/job-data.interface';

export abstract class BaseProcessor implements JobProcessor {
  protected readonly logger = new Logger(this.constructor.name);

  abstract process(data: JobData): Promise<any>;

  protected logStart(jobType: string, data: any): void {
    this.logger.log(`🔄 Starting ${jobType} job processing`);
  }

  protected logSuccess(jobType: string, result: any): void {
    this.logger.log(`✅ ${jobType} job completed successfully`);
  }

  protected logError(jobType: string, error: any): void {
    this.logger.error(`❌ ${jobType} job failed:`, error);
  }
}
