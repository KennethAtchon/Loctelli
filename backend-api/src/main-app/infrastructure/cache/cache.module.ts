import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisStoreModule, REDIS_STORE } from './redis-store.module';

export { REDIS_STORE } from './redis-store.module';

@Global()
@Module({
  imports: [
    RedisStoreModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService, REDIS_STORE],
      useFactory: async (
        _configService: ConfigService,
        redisStorePromise: Promise<ReturnType<typeof redisStore> | null>,
      ) => {
        const store = await redisStorePromise;
        if (!store) {
          return {};
        }
        // Nest typings expect Keyv/KeyvStoreAdapter; cache-manager-redis-yet store is compatible at runtime
        return { stores: [store] } as any;
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheModule, CacheService],
})
export class AppCacheModule {}
