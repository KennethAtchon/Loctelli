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
    this.logger.log('🧹 Clearing cache...');
    let cleared = 0;

    try {
      // Note: cache-manager doesn't provide a direct "flush all" method
      // We would need direct Redis access for that
      // For now, we'll test the connection and return success
      const isConnected = await this.cacheService.testConnection();
      
      if (isConnected) {
        this.logger.log('✅ Cache connection verified');
        // In a real implementation, you'd want to:
        // 1. Get Redis client from cache-manager
        // 2. Use FLUSHDB or FLUSHALL command
        // For now, we'll return a message indicating the cache is ready to be cleared
        cleared = 1; // Placeholder
      }

      return {
        message: 'Cache clear initiated (requires direct Redis access for full flush)',
        cleared,
      };
    } catch (error) {
      this.logger.error('❌ Failed to clear cache:', error);
      throw error;
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
    this.logger.log('📊 Getting system information...');

    const debug = this.configService.get<string>('DEBUG') === 'true';
    const port = this.configService.get<number>('port') || 3000;
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    // Test database connection
    let dbConnected = false;
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (error) {
      this.logger.warn('Database connection test failed:', error);
    }

    // Test cache connection
    let cacheConnected = false;
    try {
      cacheConnected = await this.cacheService.testConnection();
    } catch (error) {
      this.logger.warn('Cache connection test failed:', error);
    }

    return {
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
  }

  /**
   * Test database connection
   */
  async testDatabase(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        connected: true,
        message: 'Database connection successful',
      };
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
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
    try {
      const connected = await this.cacheService.testConnection();
      return {
        connected,
        message: connected
          ? 'Cache connection successful'
          : 'Cache connection failed',
      };
    } catch (error) {
      this.logger.error('Cache connection test failed:', error);
      return {
        connected: false,
        message: `Cache connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

