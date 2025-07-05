import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  constructor(private readonly redisService: RedisService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.handleRateLimit(req, res, next, this.defaultConfig);
  }

  private async handleRateLimit(
    req: Request,
    res: Response,
    next: NextFunction,
    config: RateLimitConfig
  ) {
    try {
      const key = this.generateKey(req, config);
      const current = await this.getCurrentRequests(key);
      
      if (current >= config.maxRequests) {
        const retryAfter = await this.getRetryAfter(key, config.windowMs);
        
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', retryAfter);
        res.setHeader('Retry-After', Math.ceil(config.windowMs / 1000));
        
        throw new HttpException(
          {
            message: 'Too many requests',
            retryAfter: Math.ceil(config.windowMs / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Increment request count
      await this.incrementRequests(key, config.windowMs);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current - 1));
      res.setHeader('X-RateLimit-Reset', Date.now() + config.windowMs);

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // If Redis is unavailable, allow the request to proceed
      next();
    }
  }

  private generateKey(req: Request, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req);
    }

    // Default key generation based on IP and route
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const route = req.route?.path || req.path;
    return `rate_limit:${ip}:${route}`;
  }

  private async getCurrentRequests(key: string): Promise<number> {
    try {
      const count = await this.redisService.getCache(key);
      return count ? parseInt(count as string, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async incrementRequests(key: string, windowMs: number): Promise<void> {
    try {
      const current = await this.getCurrentRequests(key);
      await this.redisService.setCache(key, (current + 1).toString(), windowMs / 1000);
    } catch {
      // If Redis fails, continue without rate limiting
    }
  }

  private async getRetryAfter(key: string, windowMs: number): Promise<number> {
    // Since we don't have getTTL method, we'll use the windowMs
    return Date.now() + windowMs;
  }

  // Static method for creating rate limit middleware with custom config
  static create(config: Partial<RateLimitConfig> = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      const middleware = new RateLimitMiddleware(null as any); // We'll inject RedisService properly
      const mergedConfig = { ...middleware.defaultConfig, ...config };
      middleware.handleRateLimit(req, res, next, mergedConfig);
    };
  }
}

// Specific rate limit configurations
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth_rate_limit:${ip}`;
  },
};

export const apiRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req.user as any)?.userId || 'anonymous';
    return `api_rate_limit:${ip}:${userId}`;
  },
}; 