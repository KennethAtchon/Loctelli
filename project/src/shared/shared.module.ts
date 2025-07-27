import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { StorageModule } from './storage/storage.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
    StorageModule,
    SmsModule,
  ],
  exports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
    StorageModule,
    SmsModule,
  ],
})
export class SharedModule {} 