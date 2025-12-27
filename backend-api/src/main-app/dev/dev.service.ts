import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../infrastructure/cache/cache.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class DevService {
  private readonly logger = new Logger(DevService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Clear all cache (Redis)
   * Note: This is a simplified version that clears common cache patterns
   * For a full flush, we'd need direct Redis access
   */
  async clearCache(): Promise<{ message: string; cleared: number }> {
    const startTime = Date.now();
    this.logger.log('🧹 [DevService] Starting cache clear operation...');
    let cleared = 0;

    try {
      // First verify connection
      this.logger.debug('🔍 [DevService] Verifying cache connection...');
      const isConnected = await this.cacheService.testConnection();
      
      if (!isConnected) {
        this.logger.warn('⚠️ [DevService] Cache connection test failed - cache may not be available');
        throw new Error('Cache connection failed - cannot clear cache');
      }

      this.logger.log('✅ [DevService] Cache connection verified, proceeding with flush...');
      
      // Now flush all cache keys
      cleared = await this.cacheService.flushAll();
      
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [DevService] Cache clear operation completed in ${duration}ms - cleared: ${cleared}`,
      );

      return {
        message: `Cache cleared successfully - all keys flushed from Redis database`,
        cleared,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [DevService] Cache clear failed after ${duration}ms:`,
        error instanceof Error ? error.stack : error,
      );
      
      // Return a more informative error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to clear cache: ${errorMessage}`);
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<{
    debug: boolean;
    nodeVersion: string;
    timestamp: string;
    database: {
      connected: boolean;
      provider: string;
    };
    cache: {
      connected: boolean;
    };
    config: {
      port: number;
      redisConfigured: boolean;
      databaseConfigured: boolean;
    };
  }> {
    const startTime = Date.now();
    this.logger.log('📊 [DevService] Gathering system information...');

    const debugRaw = this.configService.get<string>('DEBUG');
    const debug = debugRaw === 'true';
    const port = this.configService.get<number>('port') || 3000;
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    this.logger.debug('🔍 [DevService] Environment variables:', {
      DEBUG: debugRaw,
      PORT: port,
      REDIS_URL: redisUrl ? '***configured***' : 'not set',
      DATABASE_URL: databaseUrl ? '***configured***' : 'not set',
    });

    // Test database connection
    this.logger.debug('🔍 [DevService] Testing database connection...');
    let dbConnected = false;
    try {
      const dbStartTime = Date.now();
      await this.prismaService.$queryRaw`SELECT 1`;
      const dbDuration = Date.now() - dbStartTime;
      dbConnected = true;
      this.logger.debug(`✅ [DevService] Database connection successful (${dbDuration}ms)`);
    } catch (error) {
      this.logger.warn('⚠️ [DevService] Database connection test failed:', error);
    }

    // Test cache connection
    this.logger.debug('🔍 [DevService] Testing cache connection...');
    let cacheConnected = false;
    try {
      const cacheStartTime = Date.now();
      cacheConnected = await this.cacheService.testConnection();
      const cacheDuration = Date.now() - cacheStartTime;
      this.logger.debug(
        `✅ [DevService] Cache connection test completed (${cacheDuration}ms) - connected: ${cacheConnected}`,
      );
    } catch (error) {
      this.logger.warn('⚠️ [DevService] Cache connection test failed:', error);
    }

    const result = {
      debug,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        provider: 'postgresql',
      },
      cache: {
        connected: cacheConnected,
      },
      config: {
        port,
        redisConfigured: !!redisUrl,
        databaseConfigured: !!databaseUrl,
      },
    };

    const duration = Date.now() - startTime;
    this.logger.log(
      `✅ [DevService] System info gathered in ${duration}ms - DB: ${dbConnected}, Cache: ${cacheConnected}`,
    );
    this.logger.debug('📋 [DevService] System info result:', JSON.stringify(result, null, 2));

    return result;
  }

  /**
   * Test database connection
   */
  async testDatabase(): Promise<{ connected: boolean; message: string }> {
    const startTime = Date.now();
    this.logger.log('🔍 [DevService] Testing database connection...');
    try {
      const queryStartTime = Date.now();
      await this.prismaService.$queryRaw`SELECT 1`;
      const queryDuration = Date.now() - queryStartTime;
      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `✅ [DevService] Database connection test successful (query: ${queryDuration}ms, total: ${totalDuration}ms)`,
      );
      return {
        connected: true,
        message: 'Database connection successful',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [DevService] Database connection test failed after ${duration}ms:`,
        error instanceof Error ? error.stack : error,
      );
      return {
        connected: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Test cache connection
   */
  async testCache(): Promise<{ connected: boolean; message: string }> {
    const startTime = Date.now();
    this.logger.log('🔍 [DevService] Testing cache connection...');
    try {
      const testStartTime = Date.now();
      const connected = await this.cacheService.testConnection();
      const testDuration = Date.now() - testStartTime;
      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `✅ [DevService] Cache connection test completed (test: ${testDuration}ms, total: ${totalDuration}ms) - connected: ${connected}`,
      );
      return {
        connected,
        message: connected
          ? 'Cache connection successful'
          : 'Cache connection failed',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [DevService] Cache connection test failed after ${duration}ms:`,
        error instanceof Error ? error.stack : error,
      );
      return {
        connected: false,
        message: `Cache connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

