import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private readonly maxRetries = 30; // 30 seconds max wait time
  private readonly retryDelay = 1000; // 1 second delay between retries

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    await this.waitForRedis();
  }

  private async waitForRedis() {
    this.logger.log('Waiting for Redis to be available...');
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Try to set and get a test value to verify Redis connection
        const testKey = 'redis-connection-test';
        const testValue = 'test';
        
        await this.cacheManager.set(testKey, testValue, 1);
        const result = await this.cacheManager.get(testKey);
        
        if (result === testValue) {
          this.logger.log(`Redis connection successful on attempt ${attempt}`);
          return;
        } else {
          throw new Error('Redis test failed - value mismatch');
        }
      } catch (error) {
        this.logger.warn(`Redis connection attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === this.maxRetries) {
          this.logger.error('Max retries reached. Redis is not available.');
          if (process.env.NODE_ENV === 'production') {
            process.exit(1);
          }
          throw new Error('Redis connection failed after max retries');
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    return (await this.cacheManager.get<T>(key)) ?? null;
  }

  async setCache<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async delCache(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // Add more helpers as needed, e.g. for session, rate limit, etc., using cacheManager
} 