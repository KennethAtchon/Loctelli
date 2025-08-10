import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { StorageModule } from './storage/storage.module';
import { SmsModule } from './sms/sms.module';
import { JobQueueModule } from './job-queue/job-queue.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
    StorageModule,
    SmsModule,
    JobQueueModule,
  ],
  exports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
    StorageModule,
    SmsModule,
    JobQueueModule,
  ],
})
export class SharedModule {} 