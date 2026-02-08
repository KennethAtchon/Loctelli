import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService, ConfigModule } from '@nestjs/config';
import type { KeyvStoreAdapter } from 'keyv';
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
        redisStorePromise: Promise<Awaited<
          ReturnType<typeof redisStore>
        > | null>,
      ) => {
        const store = await redisStorePromise;
        if (!store) {
          return {};
        }
        // Keyv requires get/set/delete/clear; cache-manager-redis-yet has get/set/del/reset.
        const keyvAdapter: KeyvStoreAdapter = {
          get: store.get.bind(store),
          set: store.set.bind(store),
          delete: store.del.bind(store),
          clear: store.reset.bind(store),
          opts: {},
          on() {
            return this;
          },
        };
        return { stores: [keyvAdapter] };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheModule, CacheService],
})
export class AppCacheModule {}
