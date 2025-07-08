import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL', 'redis://localhost:6379');
        
        // Parse Redis URL to extract components
        const url = new URL(redisUrl);
        const host = url.hostname;
        const port = parseInt(url.port) || 6379;
        const password = url.password;
        const username = url.username;
        
        return {
          store: redisStore,
          host: host,
          port: port,
          password: password,
          username: username || undefined,
          ttl: 0, // Default TTL - will be overridden by individual cache operations
          max: 1000, // Maximum number of items in cache
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {} 