import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../cache/cache.service';
import {
  RateLimitConfig,
  getRateLimitConfig,
  findRateLimitRule,
} from '../config/rate-limit.config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(private readonly cacheService: CacheService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Reduced verbosity for initial trigger - only log at debug level
    this.logger.debug(
      `🚀 Rate limit middleware triggered: ${req.method} ${req.url} from ${req.ip || req.connection.remoteAddress || 'unknown'}`,
    );

    // Get rate limit configuration using the config pattern
    const rule = findRateLimitRule(req);
    const config = getRateLimitConfig(req);

    if (rule) {
      this.logger.debug(
        `🎯 Matched rate limit rule: "${rule.name}" - ${config.description || rule.name}`,
      );
    } else {
      this.logger.debug(`🎯 Using default rate limit configuration`);
    }

    this.logger.debug(
      `⚙️ Rate limit config: ${config.maxRequests} requests per ${config.windowMs / 1000 / 60} minutes`,
    );

    void this.handleRateLimit(req, res, next, config);
  }

  private async handleRateLimit(
    req: Request,
    res: Response,
    next: NextFunction,
    config: RateLimitConfig,
  ) {
    const route = `${req.method} ${req.url}`;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Reduced verbosity - only log at debug level unless approaching limit
    this.logger.debug(
      `🔍 Starting rate limit check: ${route} from ${clientIP}`,
    );
    this.logger.debug(
      `⚙️ Rate limit config: ${config.maxRequests} requests per ${config.windowMs / 1000 / 60} minutes`,
    );

    try {
      const key = this.generateKey(req, config);
      this.logger.debug(`🔑 Generated rate limit key: ${key}`);

      const current = await this.getCurrentRequests(key);
      const usagePercent = Math.round((current / config.maxRequests) * 100);

      // Log usage at different levels based on percentage
      if (usagePercent >= 90) {
        this.logger.warn(
          `📊 Current requests for ${key}: ${current}/${config.maxRequests} (${usagePercent}% used) - APPROACHING LIMIT!`,
        );
      } else if (usagePercent >= 75) {
        this.logger.warn(
          `📊 Current requests for ${key}: ${current}/${config.maxRequests} (${usagePercent}% used)`,
        );
      } else {
        this.logger.debug(
          `📊 Current requests for ${key}: ${current}/${config.maxRequests} (${usagePercent}% used)`,
        );
      }

      if (current >= config.maxRequests) {
        const retryAfter = await this.getRetryAfter(key, config.windowMs);
        const resetTime = Date.now() + retryAfter * 1000;
        const rule = findRateLimitRule(req);

        // Enhanced rate limit exceeded logging
        this.logger.warn(`🚫 ========== RATE LIMIT EXCEEDED ==========`);
        this.logger.warn(`🚫 Rule: ${rule?.name || 'default'}`);
        this.logger.warn(`🚫 Key: ${key}`);
        this.logger.warn(`🚫 Route: ${route}`);
        this.logger.warn(`🚫 Method: ${req.method}`);
        this.logger.warn(`🚫 Path: ${req.path}`);
        this.logger.warn(`🚫 IP: ${clientIP}`);
        this.logger.warn(
          `🚫 User-Agent: ${req.get('user-agent') || 'unknown'}`,
        );
        this.logger.warn(`🚫 Referer: ${req.get('referer') || 'direct'}`);
        this.logger.warn(
          `🚫 Request Count: ${current}/${config.maxRequests} (100% used)`,
        );
        this.logger.warn(
          `🚫 Window: ${config.windowMs / 1000 / 60} minutes (${config.windowMs}ms)`,
        );
        this.logger.warn(`🚫 Retry After: ${retryAfter} seconds`);
        this.logger.warn(
          `🚫 Reset Time: ${new Date(resetTime).toISOString()} (${new Date(resetTime).toLocaleString()})`,
        );
        this.logger.warn(
          `🚫 Time Until Reset: ${Math.round(retryAfter / 60)} minutes ${retryAfter % 60} seconds`,
        );
        if (rule) {
          this.logger.warn(
            `🚫 Rule Description: ${rule.config.description || rule.name}`,
          );
        }
        this.logger.warn(`🚫 =========================================`);

        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', resetTime);
        res.setHeader('Retry-After', retryAfter.toString());

        // Return 429 response without throwing exception to prevent crashes
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'ThrottlerException: Too Many Requests',
          retryAfter: retryAfter,
          limit: config.maxRequests,
          windowMs: config.windowMs,
        });
        return; // Stop processing, don't call next()
      }

      // Increment request count (only log at debug level)
      this.logger.debug(`📈 Incrementing request count for key: ${key}`);
      await this.incrementRequests(key, current, config.windowMs);

      // Set rate limit headers
      const remaining = Math.max(0, config.maxRequests - current - 1);
      const resetTime = Date.now() + config.windowMs;

      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      const rule = findRateLimitRule(req);
      const newUsagePercent = Math.round(
        ((current + 1) / config.maxRequests) * 100,
      );

      // Log at different levels based on usage
      if (newUsagePercent >= 90) {
        this.logger.warn(
          `⚠️ Rate limit check PASSED (HIGH USAGE) - Key: ${key}`,
        );
        this.logger.warn(`⚠️ Route: ${route} from ${clientIP}`);
        this.logger.warn(
          `⚠️ New count: ${current + 1}/${config.maxRequests} (${newUsagePercent}% used) - APPROACHING LIMIT!`,
        );
        this.logger.warn(`⚠️ Remaining: ${remaining} requests`);
        this.logger.warn(`⚠️ Reset time: ${new Date(resetTime).toISOString()}`);
      } else if (newUsagePercent >= 75) {
        this.logger.warn(
          `⚠️ Rate limit check PASSED (MODERATE USAGE) - Key: ${key}`,
        );
        this.logger.warn(
          `⚠️ New count: ${current + 1}/${config.maxRequests} (${newUsagePercent}% used)`,
        );
        this.logger.warn(`⚠️ Remaining: ${remaining} requests`);
      } else {
        // Only log at debug level for low usage to reduce noise
        this.logger.debug(`✅ Rate limit check PASSED - Key: ${key}`);
        this.logger.debug(`✅ Route: ${route} from ${clientIP}`);
        this.logger.debug(
          `✅ New count: ${current + 1}/${config.maxRequests} (${newUsagePercent}% used)`,
        );
        this.logger.debug(`✅ Remaining: ${remaining} requests`);
      }

      // Always log rule info if available
      if (rule) {
        this.logger.debug(
          `✅ Rule: ${rule.name} - ${rule.config.description || rule.name}`,
        );
      }

      next();
    } catch (error) {
      const errorKey = this.generateKey(req, config);
      this.logger.error(`❌ ========== RATE LIMIT ERROR ==========`);
      this.logger.error(`❌ Rate limit error for key: ${errorKey}`);
      this.logger.error(`❌ Route: ${route} from ${clientIP}`);
      this.logger.error(`❌ Method: ${req.method}`);
      this.logger.error(`❌ Path: ${req.path}`);
      this.logger.error(`❌ Error type: ${error.constructor.name}`);
      this.logger.error(`❌ Error message: ${error.message}`);
      this.logger.error(`❌ Error stack:`, error.stack);
      // If Redis is unavailable, allow the request to proceed
      this.logger.warn(
        `⚠️ Redis unavailable, allowing request to proceed: ${route} from ${clientIP}`,
      );
      this.logger.warn(
        `⚠️ This bypasses rate limiting - Redis should be checked!`,
      );
      this.logger.error(`❌ =========================================`);
      next();
    }
  }

  private generateKey(req: Request, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      const customKey = config.keyGenerator(req);
      this.logger.debug(`🔧 Using custom key generator: ${customKey}`);
      return customKey;
    }

    // Default key generation based on IP and route
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const route = req.route?.path || req.path;
    const defaultKey = `rate_limit:${ip}:${route}`;
    this.logger.debug(`🔧 Using default key generator: ${defaultKey}`);
    return defaultKey;
  }

  private async getCurrentRequests(key: string): Promise<number> {
    try {
      this.logger.debug(
        `🔍 Fetching current request count from Redis for key: ${key}`,
      );
      const data = await this.cacheService.getCache(key);

      if (!data) {
        this.logger.debug(`📊 No data found for ${key}, returning 0`);
        return 0;
      }

      const parsed = JSON.parse(data as string);
      const count = parsed.count || 0;
      this.logger.debug(`📊 Redis returned count for ${key}: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`❌ Error getting current requests for key: ${key}`);
      this.logger.error(`❌ Redis error details:`, error.stack);
      this.logger.error(`❌ Error type: ${error.constructor.name}`);
      this.logger.error(`❌ Error message: ${error.message}`);
      return 0;
    }
  }

  private async incrementRequests(
    key: string,
    currentCount: number,
    windowMs: number,
  ): Promise<void> {
    try {
      this.logger.debug(`📈 Starting increment for key: ${key}`);
      const newCount = currentCount + 1;
      const ttlSeconds = windowMs / 1000;

      // Store both count and window start time
      const windowStart = Date.now();
      const data = JSON.stringify({
        count: newCount,
        windowStart: windowStart,
      });

      this.logger.debug(
        `📈 Setting Redis cache: key=${key}, value=${data}, ttl=${ttlSeconds}s`,
      );
      await this.cacheService.setCache(key, data, ttlSeconds);
      this.logger.debug(
        `✅ Successfully incremented requests for key: ${key} to ${newCount} (TTL: ${ttlSeconds}s)`,
      );
    } catch (error) {
      this.logger.error(`❌ Error incrementing requests for key: ${key}`);
      this.logger.error(`❌ Redis increment error details:`, error.stack);
      this.logger.error(`❌ Error type: ${error.constructor.name}`);
      this.logger.error(`❌ Error message: ${error.message}`);
      // If Redis fails, continue without rate limiting
    }
  }

  private async getRetryAfter(key: string, windowMs: number): Promise<number> {
    try {
      // Get the stored data to find window start time
      const data = await this.cacheService.getCache(key);

      if (!data) {
        // No data found, use window time as fallback
        const fallbackSeconds = Math.ceil(windowMs / 1000);
        this.logger.log(
          `⏰ No data found for ${key}, using fallback: ${fallbackSeconds} seconds`,
        );
        return fallbackSeconds;
      }

      const parsed = JSON.parse(data as string);
      const windowStart = parsed.windowStart;

      if (!windowStart) {
        // No window start time, use fallback
        const fallbackSeconds = Math.ceil(windowMs / 1000);
        this.logger.log(
          `⏰ No window start time for ${key}, using fallback: ${fallbackSeconds} seconds`,
        );
        return fallbackSeconds;
      }

      // Calculate time remaining in the window
      const now = Date.now();
      const windowEnd = windowStart + windowMs;
      const timeRemaining = Math.max(0, windowEnd - now);
      const secondsRemaining = Math.ceil(timeRemaining / 1000);

      this.logger.log(
        `⏰ Window start: ${new Date(windowStart).toISOString()}`,
      );
      this.logger.log(`⏰ Window end: ${new Date(windowEnd).toISOString()}`);
      this.logger.log(`⏰ Time remaining: ${secondsRemaining} seconds`);

      return secondsRemaining;
    } catch (error) {
      this.logger.error(
        `❌ Error getting retry time for key: ${key}`,
        error.stack,
      );
      // Fallback: use the window time
      return Math.ceil(windowMs / 1000);
    }
  }

  // Static method for creating rate limit middleware with custom config
  static create(config: Partial<RateLimitConfig> = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      const middleware = new RateLimitMiddleware(null as any); // We'll inject RedisService properly
      const baseConfig = getRateLimitConfig(req);
      const mergedConfig = { ...baseConfig, ...config };
      middleware.logger.log(
        `🔧 Creating custom rate limit middleware with config:`,
        mergedConfig,
      );
      void middleware.handleRateLimit(req, res, next, mergedConfig);
    };
  }
}
