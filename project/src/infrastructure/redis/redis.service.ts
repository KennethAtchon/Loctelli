import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private readonly maxRetries = 3; // 30 seconds max wait time
  private readonly retryDelay = 1000; // 1 second delay between retries
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRedis();
    await this.waitForRedis();
  }

  private async initializeRedis() {
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    
    this.logger.log(`🔴 Initializing Redis connection to: ${redisUrl}`);
    
    this.redis = new Redis(redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      connectTimeout: 15000,
      family: 4,
    });

    // Handle Redis events
    this.redis.on('connect', () => {
      this.logger.log('🔗 Redis connected');
    });

    this.redis.on('ready', () => {
      this.logger.log('✅ Redis ready');
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis error:', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('🔌 Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.log('🔄 Redis reconnecting...');
    });
  }

  private async waitForRedis() {
    this.logger.log('Waiting for Redis to be available...');
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Try to set and get a test value to verify Redis connection
        const testKey = 'redis-connection-test';
        const testValue = 'test';
        
        await this.redis.setex(testKey, 1, testValue);
        const result = await this.redis.get(testKey);
        
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
    try {
      const result = await this.redis.get(key);
      this.logger.debug(`🔍 Redis GET ${key}: ${result ? 'found' : 'not found'}`);
      
      if (result === null) {
        return null;
      }
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(result) as T;
      } catch {
        return result as T;
      }
    } catch (error) {
      this.logger.error(`❌ Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  async setCache<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
        this.logger.debug(`💾 Redis SETEX ${key} with TTL ${ttl}s: success`);
      } else {
        await this.redis.set(key, serializedValue);
        this.logger.debug(`💾 Redis SET ${key} (no TTL): success`);
      }
    } catch (error) {
      this.logger.error(`❌ Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async delCache(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`🗑️ Redis DEL ${key}: success`);
    } catch (error) {
      this.logger.error(`❌ Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`❌ Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const result = await this.redis.ttl(key);
      return result;
    } catch (error) {
      this.logger.error(`❌ Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`❌ Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // Add more helpers as needed
} 