import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);
  
  constructor(private prisma: PrismaService) {}

  async getSystemStatus() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Get some basic stats
      const userCount = await this.prisma.user.count();
      const clientCount = await this.prisma.client.count();
      const strategyCount = await this.prisma.strategy.count();
      const bookingCount = await this.prisma.booking.count();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: {
          connected: true,
          stats: {
            users: userCount,
            clients: clientCount,
            strategies: strategyCount,
            bookings: bookingCount,
          }
        },
        uptime: process.uptime(),
      };
    } catch (error) {
      this.logger.error('System status check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  async getHealthCheck() {
    try {
      // Simple health check - just verify DB connection
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return { status: 'error' };
    }
  }
}
