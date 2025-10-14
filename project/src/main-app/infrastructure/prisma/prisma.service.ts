import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Scope, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { REQUEST } from '@nestjs/core';

// Models that require subAccountId filtering
const TENANT_SCOPED_MODELS = [
  'user',
  'strategy',
  'lead',
  'booking',
  'integration',
  'smsMessage',
  'smsCampaign',
  'businessSearch',
  'contactSubmission',
  'formTemplate',
  'formSubmission',
  'subAccountPromptTemplate',
];

@Injectable({ scope: Scope.DEFAULT })
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 30; // 30 seconds max wait time
  private readonly retryDelay = 1000; // 1 second delay between retries

  constructor() {
    super();
    this.setupMiddleware();
  }

  /**
   * Setup Prisma middleware for automatic tenant isolation
   */
  private setupMiddleware() {
    (this as any).$use(async (params: any, next: any) => {
      // Only apply to tenant-scoped models
      if (!TENANT_SCOPED_MODELS.includes(params.model?.toLowerCase() || '')) {
        return next(params);
      }

      // Skip if this is an admin operation (will have explicit subAccountId)
      // or if subAccountId is already specified
      if (params.args?.where?.subAccountId !== undefined ||
          params.args?.data?.subAccountId !== undefined) {
        return next(params);
      }

      // Log warning for queries without subAccountId filter
      if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(params.action)) {
        this.logger.warn(
          `⚠️ Query on ${params.model} without subAccountId filter. ` +
          `This may expose data across tenants. Action: ${params.action}`
        );
      }

      // For create/update operations without subAccountId, log error
      if (['create', 'update', 'upsert'].includes(params.action)) {
        if (!params.args?.data?.subAccountId) {
          this.logger.error(
            `❌ SECURITY VIOLATION: Attempting to ${params.action} ${params.model} without subAccountId!`
          );
        }
      }

      return next(params);
    });

    this.logger.log('✅ Prisma middleware for tenant isolation initialized');
  }

  /**
   * Enable strict tenant isolation mode (throws errors instead of warnings)
   * Call this method in production environments
   */
  enableStrictTenantMode() {
    (this as any).$use(async (params: any, next: any) => {
      if (!TENANT_SCOPED_MODELS.includes(params.model?.toLowerCase() || '')) {
        return next(params);
      }

      // Skip if subAccountId is explicitly provided
      if (params.args?.where?.subAccountId !== undefined ||
          params.args?.data?.subAccountId !== undefined) {
        return next(params);
      }

      // In strict mode, throw errors for unscoped operations
      if (['findMany', 'findFirst', 'count', 'aggregate'].includes(params.action)) {
        throw new Error(
          `SECURITY: ${params.model}.${params.action} requires subAccountId filter in strict mode`
        );
      }

      if (['create', 'update', 'upsert'].includes(params.action)) {
        if (!params.args?.data?.subAccountId) {
          throw new Error(
            `SECURITY: ${params.model}.${params.action} requires subAccountId in data`
          );
        }
      }

      return next(params);
    });

    this.logger.log('🔒 Strict tenant isolation mode ENABLED');
  }

  async onModuleInit() {
    await this.waitForDatabase();
    await this.$connect();
    await this.migrate();
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
        this.logger.warn(`Database connection attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === this.maxRetries) {
          this.logger.error('Max retries reached. Database is not available.');
          if (process.env.NODE_ENV === 'production') {
            process.exit(1);
          }
          throw new Error('Database connection failed after max retries');
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  private async migrate() {
    try {
      this.logger.log('Running database migrations...');
      
      // Run Prisma migrations
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env,
      });
      
      this.logger.log('Database migrations completed successfully');
    } catch (error) {
      this.logger.error('Failed to run database migrations:', error);
      // In production, you might want to exit the process if migrations fail
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('Exiting due to migration failure in production');
        process.exit(1);
      }
    }
  }
}
