import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 30; // 30 seconds max wait time
  private readonly retryDelay = 1000; // 1 second delay between retries

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.waitForDatabase();
    await this.$connect();
    this.migrate();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async waitForDatabase() {
    this.logger.log('Waiting for database to be available...');

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Try to connect to the database
        await this.$connect();
        this.logger.log(`Database connection successful on attempt ${attempt}`);
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt} failed: ${error.message}`,
        );

        if (attempt === this.maxRetries) {
          this.logger.error('Max retries reached. Database is not available.');
          if (process.env.DEBUG !== 'true') {
            process.exit(1);
          }
          throw new Error('Database connection failed after max retries');
        }

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  private migrate() {
    try {
      this.logger.log('Running database migrations...');

      // Run Prisma migrations
      execSync('bunx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env,
      });

      this.logger.log('Database migrations completed successfully');
    } catch (error) {
      this.logger.error('Failed to run database migrations:', error);
      if (process.env.DEBUG !== 'true') {
        this.logger.error('Exiting due to migration failure in production');
        process.exit(1);
      }
    }
  }
}
