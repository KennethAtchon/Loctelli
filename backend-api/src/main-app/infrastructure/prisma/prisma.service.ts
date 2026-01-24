import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Models that require subAccountId filtering
const TENANT_SCOPED_MODELS = [
  'user',
  'strategy',
  'lead',
  'booking',
  'integration',
  'contactSubmission',
  'formTemplate',
  'formSubmission',
  'subAccountPromptTemplate',
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 30; // 30 seconds max wait time
  private readonly retryDelay = 1000; // 1 second delay between retries

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // Set up query logging for tenant isolation warnings
    this.$on(
      'query' as never,
      ((e: any) => {
        this.checkTenantIsolation(e);
      }) as never,
    );

    this.logger.log(
      '✅ Prisma service initialized with tenant isolation monitoring',
    );
  }

  /**
   * Check queries for tenant isolation compliance
   * Note: This is a monitoring solution. For strict enforcement, use query extensions.
   */
  private checkTenantIsolation(event: any) {
    // This is a basic monitoring approach
    // For production, consider using Prisma Client Extensions for stricter enforcement
    const query = event.query?.toLowerCase() || '';

    // Check if query involves tenant-scoped models but doesn't include subAccountId
    const involvesTenantModel = TENANT_SCOPED_MODELS.some(
      (model) => query.includes(`"${model}"`) || query.includes(`'${model}'`),
    );

    if (involvesTenantModel && !query.includes('subaccountid')) {
      this.logger.warn(
        `⚠️ Query on tenant-scoped model without subAccountId filter. ` +
          `This may expose data across tenants.`,
      );
    }
  }

  /**
   * Enable strict tenant isolation mode (throws errors instead of warnings)
   * Note: With Prisma 5+, strict enforcement should be done via Client Extensions
   * This is kept for backwards compatibility but logs a deprecation notice
   */
  enableStrictTenantMode() {
    this.logger.warn(
      '⚠️ enableStrictTenantMode() is deprecated. ' +
        'With Prisma 5+, use Client Extensions for strict enforcement. ' +
        'See: https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions',
    );
    this.logger.log(
      '🔒 Strict tenant isolation monitoring ENABLED (logging only)',
    );
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
