import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
  ],
  exports: [
    ConfigModule,
    PrismaModule,
    CacheModule,
  ],
})
export class SharedModule {} 