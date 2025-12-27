import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.logger.log('🔧 CacheService initialized');
    this.logger.log(`🔧 Cache manager type: ${typeof this.cacheManager}`);
    this.logger.log(
      `🔧 Cache manager methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(this.cacheManager)).join(', ')}`,
    );
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.get<T>(key);
      this.logger.debug(
        `🔍 Cache GET ${key}: ${result ? 'found' : 'not found'}`,
      );
      return result || null;
    } catch (error) {
      this.logger.error(`❌ Cache GET error for key ${key}:`, error);
      throw error;
    }
  }

  async setCache<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        // Convert seconds to milliseconds for cache-manager-redis-yet
        const ttlMs = ttl * 1000;
        await this.cacheManager.set(key, value, ttlMs);
        this.logger.debug(
          `💾 Cache SET ${key} with TTL ${ttl}s (${ttlMs}ms): success`,
        );
      } else {
        await this.cacheManager.set(key, value);
        this.logger.debug(`💾 Cache SET ${key} (no TTL): success`);
      }
    } catch (error) {
      this.logger.error(`❌ Cache SET error for key ${key}:`, error);
      throw error;
    }
  }

  async delCache(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`🗑️ Cache DEL ${key}: success`);
    } catch (error) {
      this.logger.error(`❌ Cache DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.cacheManager.get(key);
      const exists = result !== null && result !== undefined;
      this.logger.debug(`🔍 Cache EXISTS ${key}: ${exists ? 'true' : 'false'}`);
      return exists;
    } catch (error) {
      this.logger.error(`❌ Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      // Note: cache-manager doesn't provide direct TTL access
      // This is a simplified implementation
      const exists = await this.exists(key);
      return exists ? 1 : -1; // Return 1 if exists, -1 if not
    } catch (error) {
      this.logger.error(`❌ Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      if (value !== null && value !== undefined) {
        // Convert seconds to milliseconds for cache-manager-redis-yet
        const ttlMs = ttl * 1000;
        await this.cacheManager.set(key, value, ttlMs);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Cache EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // Test Redis connection
  async testConnection(): Promise<boolean> {
    try {
      const testKey = 'redis_connection_test';
      const testValue = 'test_value_' + Date.now();

      this.logger.log('🔍 Testing Redis connection...');

      // Try to set a test value
      await this.cacheManager.set(testKey, testValue, 10000); // 10 seconds in ms
      this.logger.log('✅ Redis SET test passed');

      // Try to get the test value
      const retrieved = await this.cacheManager.get(testKey);
      this.logger.log(`✅ Redis GET test passed: ${String(retrieved)}`);

      // Try to delete the test value
      await this.cacheManager.del(testKey);
      this.logger.log('✅ Redis DEL test passed');

      this.logger.log('✅ Redis connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Redis connection test failed:', error);
      return false;
    }
  }

  /**
   * Flush all keys from the current Redis database (FLUSHDB)
   * This accesses the underlying Redis client from cache-manager-redis-yet
   */
  async flushAll(): Promise<number> {
    try {
      this.logger.log(
        '🧹 [CacheService] Attempting to flush all cache keys...',
      );

      // Access the underlying store from cache-manager
      // The store is typically available as a property on the cache manager
      const store = (this.cacheManager as any).store;

      if (!store) {
        this.logger.warn(
          '⚠️ [CacheService] Store not available, cannot flush cache',
        );
        throw new Error('Redis store not available');
      }

      // Access the Redis client from the store
      // cache-manager-redis-yet exposes the client as 'client' property
      const client = store.client || store.redis || store;

      if (!client) {
        this.logger.warn(
          '⚠️ [CacheService] Redis client not available, cannot flush cache',
        );
        throw new Error('Redis client not available');
      }

      // Check if client has flushDb method (ioredis/redis client)
      if (typeof client.flushDb === 'function') {
        this.logger.debug('🔍 [CacheService] Using flushDb() method');
        await client.flushDb();
        this.logger.log(
          '✅ [CacheService] Cache flushed successfully using flushDb()',
        );
        return 1;
      }

      // Try FLUSHDB command directly
      if (typeof client.sendCommand === 'function') {
        this.logger.debug('🔍 [CacheService] Using sendCommand(FLUSHDB)');
        await client.sendCommand(['FLUSHDB']);
        this.logger.log(
          '✅ [CacheService] Cache flushed successfully using FLUSHDB command',
        );
        return 1;
      }

      // Try as a regular Redis client with command method
      if (typeof client.command === 'function') {
        this.logger.debug('🔍 [CacheService] Using command(FLUSHDB)');
        await client.command('FLUSHDB');
        this.logger.log(
          '✅ [CacheService] Cache flushed successfully using command()',
        );
        return 1;
      }

      // Last resort: try to call FLUSHDB directly
      if (client.FLUSHDB) {
        this.logger.debug('🔍 [CacheService] Using FLUSHDB property');
        await client.FLUSHDB();
        this.logger.log(
          '✅ [CacheService] Cache flushed successfully using FLUSHDB property',
        );
        return 1;
      }

      this.logger.warn(
        '⚠️ [CacheService] Could not find flush method on Redis client',
      );
      this.logger.debug(
        '🔍 [CacheService] Available client methods:',
        Object.keys(client),
      );
      throw new Error('Redis client does not support FLUSHDB operation');
    } catch (error) {
      this.logger.error('❌ [CacheService] Failed to flush cache:', error);
      throw error;
    }
  }

  // Additional cache manager specific methods
  keys(pattern?: string): Promise<string[]> {
    try {
      // Note: cache-manager doesn't provide direct keys access
      // This would need to be implemented differently if needed
      this.logger.warn('Cache KEYS method not implemented with cache-manager');
      return Promise.resolve([]);
    } catch (error) {
      this.logger.error('❌ Cache KEYS error:', error);
      return Promise.resolve([]);
    }
  }
}
