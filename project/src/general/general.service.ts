import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';

@Injectable()
export class GeneralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  // This service is intentionally empty as the controller methods
  // don't require any complex business logic

  async getDashboardStats() {
    try {
      // Get counts from database
      const [
        totalUsers,
        activeUsers,
        totalStrategies,
        totalBookings,
        totalClients,
        recentUsers
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.strategy.count(),
        this.prisma.booking.count(),
        this.prisma.client.count(),
        this.prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            company: true
          }
        })
      ]);

      // Calculate percentage changes (mock data for now)
      const stats = {
        totalUsers,
        activeUsers,
        totalStrategies,
        totalBookings,
        totalClients,
        recentUsers,
        growthRates: {
          users: 12, // Mock percentage
          activeUsers: 8,
          strategies: 5,
          bookings: -2
        }
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
  }

  async getSystemStatus() {
    try {
      const status = {
        database: 'Healthy',
        apiServer: 'Online',
        redisCache: 'Connected',
        fileStorage: 'Available'
      };

      // Check database connection
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        status.database = 'Error';
      }

      // Check Redis connection
      try {
        const testKey = 'system-status-test';
        await this.redisService.setCache(testKey, 'test', 1);
        const result = await this.redisService.getCache(testKey);
        if (result !== 'test') {
          status.redisCache = 'Error';
        }
      } catch (error) {
        status.redisCache = 'Disconnected';
      }

      return status;
    } catch (error) {
      throw new Error(`Failed to check system status: ${error.message}`);
    }
  }
}
