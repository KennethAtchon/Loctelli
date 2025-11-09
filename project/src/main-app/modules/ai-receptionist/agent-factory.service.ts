import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIReceptionistFactory, type AgentInstance, type AIReceptionistConfig } from '@atchonk/ai-receptionist';
import { DatabaseStorage } from '@atchonk/ai-receptionist';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { AgentInstanceConfig } from '@atchonk/ai-receptionist';
import { GoogleCalendarConfigService } from './config/google-calendar-config.service';
import { BookingTools } from './custom-tools/booking-tools';
import { LeadManagementTools } from './custom-tools/lead-management-tools';

/**
 * Service responsible for managing AI-receptionist factory and agent instances
 * Uses factory pattern for efficient agent creation in server environments
 */
@Injectable()
export class AgentFactoryService implements OnModuleInit {
  private readonly logger = new Logger(AgentFactoryService.name);
  private factory: AIReceptionistFactory | null = null;
  private agentCache = new Map<string, AgentInstance>();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes
  private db: ReturnType<typeof drizzle> | null = null;

  constructor(
    private configService: ConfigService,
    private googleCalendarConfig: GoogleCalendarConfigService,
    private bookingTools: BookingTools,
    private leadManagementTools: LeadManagementTools
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing AI Receptionist Factory Service...');

    try {
      // Initialize database connection for memory storage
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (databaseUrl) {
        this.logger.log('Creating database connection for AI-receptionist memory storage...');
        const pool = new Pool({ connectionString: databaseUrl });
        this.db = drizzle(pool);
        
        // Test the connection
        try {
          await pool.query('SELECT 1');
          this.logger.log('✅ Database connection test successful for AI-receptionist memory storage');
        } catch (error) {
          this.logger.error('❌ Database connection test failed:', error);
          throw error;
        }
      } else {
        this.logger.warn('⚠️ DATABASE_URL not found - AI-receptionist will use in-memory storage only');
      }

      // Create factory configuration (agent config is optional for factory)
      const factoryConfig: AIReceptionistConfig = {
        model: {
          provider: 'openai',
          apiKey: this.configService.get<string>('OPENAI_API_KEY')!,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 500
        },
        providers: {
          communication: this.configService.get<string>('TWILIO_ACCOUNT_SID') ? {
            twilio: {
              accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID')!,
              authToken: this.configService.get<string>('TWILIO_AUTH_TOKEN')!,
              phoneNumber: this.configService.get<string>('TWILIO_PHONE_NUMBER')!,
              webhookBaseUrl: this.configService.get<string>('BASE_URL') || 'http://localhost:8000',
              voiceWebhookPath: '/ai-receptionist/webhooks/voice',
              smsWebhookPath: '/ai-receptionist/webhooks/sms'
            }
          } : undefined,
          email: this.configService.get<string>('POSTMARK_API_KEY') ? {
            postmark: {
              apiKey: this.configService.get<string>('POSTMARK_API_KEY')!,
              fromEmail: this.configService.get<string>('POSTMARK_FROM_EMAIL')!,
              fromName: this.configService.get<string>('POSTMARK_FROM_NAME')!
            }
          } : undefined,
          calendar: this.googleCalendarConfig.getGoogleCalendarConfig()
        },
        storage: this.db ? {
          type: 'database',
          database: {
            db: this.db,
            autoMigrate: true
          }
        } : {
          type: 'memory'
        },
        tools: {
          // Register custom tools at factory level
          // These tools extract userId and leadId from ExecutionContext.metadata
          custom: [
            // Booking tools - timezone will be resolved from lead data in tool execution
            this.bookingTools.createBookMeetingTool(), // Generic version without timezone in description
            this.bookingTools.createCheckAvailabilityTool(),
            // Lead management tools
            this.leadManagementTools.createUpdateLeadDetailsTool(),
            this.leadManagementTools.createUpdateConversationStateTool()
          ]
        },
        logger: {
          level: (process.env.LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE') || 'NONE',
          enableTimestamps: true,
          // Ignore verbose tags - can be configured via environment variable
          // Supports comma-separated list: LOGGER_IGNORE_TAGS="MemoryManager,DatabaseStorage"
          ignoreTags: process.env.LOGGER_IGNORE_TAGS
            ? process.env.LOGGER_IGNORE_TAGS.split(',').map(tag => tag.trim())
            : [
                'MemoryManager', // Ignore memory storage logs
                'DatabaseStorage', // Ignore database storage logs
              ]
        } as any, // Type assertion until package types are regenerated with ignoreTags
        debug: process.env.DEBUG === 'true'
      };

      // Log storage configuration
      this.logger.log('Storage configuration:', {
        hasDb: !!this.db,
        storageType: factoryConfig.storage?.type,
        hasDatabaseConfig: !!(factoryConfig.storage && 'database' in factoryConfig.storage),
        autoMigrate: factoryConfig.storage && 'database' in factoryConfig.storage ? factoryConfig.storage.database?.autoMigrate : undefined
      });

      // Initialize factory
      this.factory = await AIReceptionistFactory.create(factoryConfig);
      this.logger.log('✅ AI Receptionist Factory initialized successfully');

      // Start cache cleanup interval
      this.startCacheCleanup();
    } catch (error) {
      this.logger.error('Failed to initialize AI Receptionist Factory:', error);
      throw error;
    }
  }

  /**
   * Get or create an agent instance for a specific user and lead
   * Uses caching to avoid recreating agents unnecessarily
   * Always rebuilds prompt using SDK's rebuildSystemPrompt() to ensure it's up to date
   */
  async getOrCreateAgent(
    userId: number,
    leadId: number,
    agentConfig: AgentInstanceConfig
  ): Promise<AgentInstance> {
    const cacheKey = `${userId}-${leadId}`;

    // Check cache first
    if (this.agentCache.has(cacheKey)) {
      const cached = this.agentCache.get(cacheKey)!;
      this.logger.debug(`Using cached agent for userId=${userId}, leadId=${leadId}, updating config`);
      
      // Update agent configuration with new config using withAgentConfig()
      // This will rebuild components and prompt as needed
      // Note: Type assertion needed until package types are regenerated
      (cached.agent as any).withAgentConfig({
        identity: agentConfig.identity,
        personality: agentConfig.personality,
        knowledge: agentConfig.knowledge,
        goals: agentConfig.goals,
        memory: agentConfig.memory,
        customSystemPrompt: agentConfig.customSystemPrompt
      });
      
      // Rebuild prompt if it was marked for rebuild
      await cached.agent.rebuildSystemPrompt();
      
      // Always log the full system prompt
      const fullPrompt = cached.agent.getSystemPrompt();
      this.logger.log(`[FULL SYSTEM PROMPT] userId=${userId}, leadId=${leadId}\n${fullPrompt}`);
      
      return cached;
    }

    if (!this.factory) {
      throw new Error('AI Receptionist Factory not initialized');
    }

    // Create new agent instance
    this.logger.debug(`Creating new agent instance for userId=${userId}, leadId=${leadId}`);
    const agent = await this.factory.createAgent(agentConfig);

    // Always log the full system prompt for new agents
    const fullPrompt = agent.agent.getSystemPrompt();
    this.logger.log(`[FULL SYSTEM PROMPT] userId=${userId}, leadId=${leadId}\n${fullPrompt}`);

    // Cache the agent
    this.agentCache.set(cacheKey, agent);

    return agent;
  }

  /**
   * Dispose of an agent instance and remove from cache
   */
  async disposeAgent(userId: number, leadId: number): Promise<void> {
    const cacheKey = `${userId}-${leadId}`;
    const agent = this.agentCache.get(cacheKey);

    if (agent) {
      await agent.dispose();
      this.agentCache.delete(cacheKey);
      this.logger.debug(`Disposed agent for userId=${userId}, leadId=${leadId}`);
    }
  }

  /**
   * Clear all cached agents
   */
  async clearCache(): Promise<void> {
    this.logger.log('Clearing agent cache...');
    const disposePromises = Array.from(this.agentCache.values()).map(agent => agent.dispose());
    await Promise.all(disposePromises);
    this.agentCache.clear();
    this.logger.log('Agent cache cleared');
  }

  /**
   * Start periodic cache cleanup to prevent memory leaks
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.logger.debug(`Cache cleanup: ${this.agentCache.size} agents cached`);
      // In a production system, you might want to implement LRU eviction here
      // For now, we'll just log the cache size
    }, this.cacheTimeout);
  }

  /**
   * Get factory instance (for advanced usage)
   */
  getFactory(): AIReceptionistFactory {
    if (!this.factory) {
      throw new Error('AI Receptionist Factory not initialized');
    }
    return this.factory;
  }
}

