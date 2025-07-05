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

  async getRecentClients() {
    try {
      return await this.prisma.client.findMany({
        take: 5,
        orderBy: {
          id: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          strategy: {
            select: {
              id: true,
              name: true,
              tag: true,
            }
          },
          bookings: {
            select: {
              id: true,
              bookingType: true,
              status: true,
              createdAt: true,
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to fetch recent clients: ${error.message}`);
    }
  }

  async getDetailedUser(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          strategies: {
            select: {
              id: true,
              name: true,
              tag: true,
              tone: true,
            }
          },
          clients: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            }
          },
          bookings: {
            select: {
              id: true,
              bookingType: true,
              status: true,
              createdAt: true,
            }
          }
        }
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to fetch detailed user: ${error.message}`);
    }
  }

  async getDetailedClient(clientId: number) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          strategy: {
            select: {
              id: true,
              name: true,
              tag: true,
            }
          },
          bookings: {
            select: {
              id: true,
              bookingType: true,
              status: true,
              createdAt: true,
            }
          }
        }
      });

      if (!client) {
        throw new Error(`Client with ID ${clientId} not found`);
      }

      return client;
    } catch (error) {
      throw new Error(`Failed to fetch detailed client: ${error.message}`);
    }
  }

  async getDatabaseSchema() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      
      // Parse the schema to extract model information
      const models = this.parsePrismaSchema(schemaContent);
      
      return {
        success: true,
        data: {
          models,
          rawSchema: schemaContent,
          lastModified: fs.statSync(schemaPath).mtime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to read database schema',
        details: error.message
      };
    }
  }

  private parsePrismaSchema(content: string): any[] {
    const models: any[] = [];
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = modelRegex.exec(content)) !== null) {
      const modelName = match[1];
      const modelContent = match[2];
      const fields = this.parseModelFields(modelContent);
      
      models.push({
        name: modelName,
        fields
      });
    }

    return models;
  }

  private parseModelFields(modelContent: string): any[] {
    const fields: any[] = [];
    const lines = modelContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.includes('@relation')) {
        continue;
      }

      const fieldMatch = trimmedLine.match(/^(\w+)\s+(\w+(?:\[\])?)\s*(\?)?\s*(.*)$/);
      if (fieldMatch) {
        const [, name, type, optional, attributes] = fieldMatch;
        
        const field = {
          name,
          type: type.replace('[]', ''),
          isRequired: !optional,
          isId: attributes.includes('@id'),
          isUnique: attributes.includes('@unique'),
          isRelation: type.includes('[]') || attributes.includes('@relation'),
          relationType: type.includes('[]') ? 'one-to-many' : 'many-to-one',
          relationTarget: this.extractRelationTarget(attributes)
        };

        fields.push(field);
      }
    }

    return fields;
  }

  private extractRelationTarget(attributes: string) {
    const relationMatch = attributes.match(/@relation\([^)]*\)/);
    if (relationMatch) {
      const targetMatch = relationMatch[0].match(/references:\s*\[(\w+)\]/);
      return targetMatch ? targetMatch[1] : null;
    }
    return null;
  }
}
