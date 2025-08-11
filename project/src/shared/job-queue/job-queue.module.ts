import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobQueueService } from './job-queue.service';
import { EmailProcessor } from './processors/email-processor';
import { SmsProcessor } from './processors/sms-processor';
import { DataExportProcessor } from './processors/data-export-processor';
import { GenericTaskProcessor } from './processors/generic-task-processor';
import { SmsModule } from '../sms/sms.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [
    ConfigModule, 
    SmsModule, 
    PrismaModule,
  ],
  providers: [
    JobQueueService,
    EmailProcessor,
    SmsProcessor,
    DataExportProcessor,
    GenericTaskProcessor,
  ],
  exports: [JobQueueService],
})
export class JobQueueModule {}