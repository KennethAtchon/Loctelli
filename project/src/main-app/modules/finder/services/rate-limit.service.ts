import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private prisma: PrismaService) {}

  async checkRateLimit(
    userId: number | null,
    service: string,
    ipAddress?: string,
    customLimit?: number,
  ): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      // Check user-specific rate limit if userId is provided
      if (userId) {
        const userLimit = await this.getUserRateLimit(userId, service, windowStart, customLimit);
        if (!userLimit.allowed) {
          return false;
        }
      }

      // Check IP-based rate limit for additional protection
      if (ipAddress) {
        const ipLimit = await this.getIpRateLimit(ipAddress, service, windowStart);
        if (!ipLimit.allowed) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Rate limit check error: ${error.message}`, error.stack);
      // In case of error, allow the request but log it
      return true;
    }
  }

  async incrementUsage(
    userId: number | null,
    service: string,
    ipAddress?: string,
  ): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      // Increment user usage
      if (userId) {
        await this.incrementUserUsage(userId, service, windowStart);
      }

      // Increment IP usage
      if (ipAddress) {
        await this.incrementIpUsage(ipAddress, service, windowStart);
      }
    } catch (error) {
      this.logger.error(`Rate limit increment error: ${error.message}`, error.stack);
    }
  }

  async recordViolation(
    userId: number | null,
    service: string,
    ipAddress?: string,
  ): Promise<void> {
    const now = new Date();
    const blockDuration = 24 * 60 * 60 * 1000; // 24 hours
    const blockedUntil = new Date(now.getTime() + blockDuration);

    try {
      if (userId) {
        await this.prisma.rateLimit.upsert({
          where: { userId_service: { userId, service } },
          update: {
            violations: { increment: 1 },
            blockedUntil: blockedUntil,
            updatedAt: now,
          },
          create: {
            userId,
            service,
            requestCount: 0,
            dailyLimit: 500,
            windowStart: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            violations: 1,
            blockedUntil: blockedUntil,
          },
        });
      }

      if (ipAddress) {
        await this.prisma.rateLimit.upsert({
          where: { ipAddress_service: { ipAddress, service } },
          update: {
            violations: { increment: 1 },
            blockedUntil: blockedUntil,
            updatedAt: now,
          },
          create: {
            ipAddress,
            service,
            requestCount: 0,
            dailyLimit: 500,
            windowStart: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            violations: 1,
            blockedUntil: blockedUntil,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Rate limit violation record error: ${error.message}`, error.stack);
    }
  }

  async getRateLimitStatus(
    userId: number,
    service: string,
  ): Promise<{
    currentUsage: number;
    dailyLimit: number;
    remaining: number;
    resetTime: Date;
    isBlocked: boolean;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const resetTime = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

    // Validate userId parameter
    if (!userId) {
      this.logger.error(`Invalid userId provided: ${userId}`);
      return {
        currentUsage: 0,
        dailyLimit: 500,
        remaining: 500,
        resetTime,
        isBlocked: false,
      };
    }

    const rateLimit = await this.prisma.rateLimit.findUnique({
      where: { 
        userId_service: { 
          userId: userId, 
          service: service 
        } 
      },
    });

    if (!rateLimit) {
      return {
        currentUsage: 0,
        dailyLimit: 500,
        remaining: 500,
        resetTime,
        isBlocked: false,
      };
    }

    // Check if current window
    const isCurrentWindow = rateLimit.windowStart.getTime() === windowStart.getTime();
    const currentUsage = isCurrentWindow ? rateLimit.requestCount : 0;
    const remaining = Math.max(0, rateLimit.dailyLimit - currentUsage);
    const isBlocked = rateLimit.blockedUntil && rateLimit.blockedUntil > now;

    return {
      currentUsage,
      dailyLimit: rateLimit.dailyLimit,
      remaining,
      resetTime,
      isBlocked: Boolean(isBlocked),
    };
  }

  async resetUserLimit(userId: number, service: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    await this.prisma.rateLimit.upsert({
      where: { userId_service: { userId, service } },
      update: {
        requestCount: 0,
        windowStart: windowStart,
        violations: 0,
        blockedUntil: null,
        updatedAt: now,
      },
      create: {
        userId,
        service,
        requestCount: 0,
        dailyLimit: 500,
        windowStart: windowStart,
        violations: 0,
      },
    });
  }

  private async getUserRateLimit(
    userId: number,
    service: string,
    windowStart: Date,
    customLimit?: number,
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const now = new Date();

    const rateLimit = await this.prisma.rateLimit.upsert({
      where: { userId_service: { userId, service } },
      update: {
        // Reset counter if it's a new day
        requestCount: {
          set: 0, // Will be overridden below if same day
        },
        windowStart: windowStart,
        updatedAt: now,
      },
      create: {
        userId,
        service,
        requestCount: 0,
        dailyLimit: customLimit || 500,
        windowStart: windowStart,
      },
    });

    // If it's the same day, preserve the counter
    if (rateLimit.windowStart.getTime() === windowStart.getTime()) {
      // Keep existing counter
    } else {
      // Reset for new day
      await this.prisma.rateLimit.update({
        where: { id: rateLimit.id },
        data: { requestCount: 0, windowStart },
      });
      rateLimit.requestCount = 0;
    }

    // Check if blocked
    if (rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
      return { allowed: false, current: rateLimit.requestCount, limit: rateLimit.dailyLimit };
    }

    const allowed = rateLimit.requestCount < rateLimit.dailyLimit;
    return { allowed, current: rateLimit.requestCount, limit: rateLimit.dailyLimit };
  }

  private async getIpRateLimit(
    ipAddress: string,
    service: string,
    windowStart: Date,
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const now = new Date();
    const ipLimit = 1000; // Higher limit for IP-based tracking

    const rateLimit = await this.prisma.rateLimit.upsert({
      where: { ipAddress_service: { ipAddress, service } },
      update: {
        windowStart: windowStart,
        updatedAt: now,
      },
      create: {
        ipAddress,
        service,
        requestCount: 0,
        dailyLimit: ipLimit,
        windowStart: windowStart,
      },
    });

    // Reset counter if new day
    if (rateLimit.windowStart.getTime() !== windowStart.getTime()) {
      await this.prisma.rateLimit.update({
        where: { id: rateLimit.id },
        data: { requestCount: 0, windowStart },
      });
      rateLimit.requestCount = 0;
    }

    // Check if blocked
    if (rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
      return { allowed: false, current: rateLimit.requestCount, limit: rateLimit.dailyLimit };
    }

    const allowed = rateLimit.requestCount < rateLimit.dailyLimit;
    return { allowed, current: rateLimit.requestCount, limit: rateLimit.dailyLimit };
  }

  private async incrementUserUsage(userId: number, service: string, windowStart: Date): Promise<void> {
    await this.prisma.rateLimit.updateMany({
      where: {
        userId,
        service,
        windowStart,
      },
      data: {
        requestCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  private async incrementIpUsage(ipAddress: string, service: string, windowStart: Date): Promise<void> {
    await this.prisma.rateLimit.updateMany({
      where: {
        ipAddress,
        service,
        windowStart,
      },
      data: {
        requestCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const remoteAddress = request.connection?.remoteAddress || request.socket?.remoteAddress;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIp || remoteAddress || 'unknown';
  }
}