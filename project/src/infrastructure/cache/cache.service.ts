import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCache<T = any>(key: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.get<T>(key);
      this.logger.debug(`🔍 Cache GET ${key}: ${result ? 'found' : 'not found'}`);
      return result || null;
    } catch (error) {
      this.logger.error(`❌ Cache GET error for key ${key}:`, error);
      throw error;
    }
  }

  async setCache<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.cacheManager.set(key, value, ttl);
        this.logger.debug(`💾 Cache SET ${key} with TTL ${ttl}s: success`);
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
      return result !== null && result !== undefined;
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
        await this.cacheManager.set(key, value, ttl);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Cache EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // Additional cache manager specific methods
  async keys(pattern?: string): Promise<string[]> {
    try {
      // Note: cache-manager doesn't provide direct keys access
      // This would need to be implemented differently if needed
      this.logger.warn('Cache KEYS method not implemented with cache-manager');
      return [];
    } catch (error) {
      this.logger.error('❌ Cache KEYS error:', error);
      return [];
    }
  }
} 