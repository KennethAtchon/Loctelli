import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

/** Token for injecting the Redis store (for key listing in monitor). */
export const REDIS_STORE = Symbol('REDIS_STORE');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_STORE,
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        const cacheConfig = configService.get('cache');
        const redisUrl = redisConfig?.url;
        if (redisUrl) {
          return redisStore({
            url: redisUrl,
            ttl: cacheConfig?.ttl || 3 * 60000,
          });
        }
        const host = redisConfig?.host || 'localhost';
        const port = redisConfig?.port || 6379;
        return redisStore({
          socket: { host, port },
          ttl: cacheConfig?.ttl || 3 * 60000,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_STORE],
})
export class RedisStoreModule {}
