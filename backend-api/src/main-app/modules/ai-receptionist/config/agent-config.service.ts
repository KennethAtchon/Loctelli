import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AgentInstanceConfig } from '../types/agent-config.types';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PromptTemplatesService } from '../../prompt-templates/prompt-templates.service';
import { AgentConfigMapper } from '../mappers/agent-config.mapper';
import { CacheService } from '../../../../shared/cache/cache.service';

/**
 * Service responsible for building agent configurations from database entities
 * Uses caching to improve performance (30 minute TTL)
 */
@Injectable()
export class AgentConfigService {
  private readonly logger = new Logger(AgentConfigService.name);
  private readonly CACHE_TTL = 30 * 60; // 30 minutes in seconds
  private readonly CACHE_PREFIX = 'agent-config';

  constructor(
    private prisma: PrismaService,
    private promptTemplatesService: PromptTemplatesService,
    private mapper: AgentConfigMapper,
    private cacheService: CacheService,
  ) {}

  /**
   * Get agent configuration for a specific user and lead
   * Uses caching to avoid repeated database queries
   */
  async getAgentConfig(
    userId: number,
    leadId: number,
  ): Promise<AgentInstanceConfig> {
    this.logger.debug(
      `Getting agent config for userId=${userId}, leadId=${leadId}`,
    );

    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}:${userId}:${leadId}`;
    const cachedConfig =
      await this.cacheService.getCache<AgentInstanceConfig>(cacheKey);

    if (cachedConfig) {
      this.logger.debug(
        `Cache HIT for agent config: userId=${userId}, leadId=${leadId}`,
      );
      return cachedConfig;
    }

    this.logger.debug(
      `Cache MISS for agent config: userId=${userId}, leadId=${leadId}`,
    );

    // Fetch all required entities
    const [user, lead, promptTemplate] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { subAccount: true },
      }),
      this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { strategy: true },
      }),
      this.getPromptTemplateForUser(userId),
    ]);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    const strategy = lead.strategy;

    // Build agent configuration using mapper
    const agentConfig: AgentInstanceConfig = {
      identity: this.mapper.mapIdentity(strategy, promptTemplate),
      personality: this.mapper.mapPersonality(strategy),
      knowledge: this.mapper.mapKnowledge(strategy, promptTemplate, user, lead),
      goals: this.mapper.mapGoals(strategy, promptTemplate),
      memory: {
        contextWindow: promptTemplate?.maxTokens
          ? Math.floor(promptTemplate.maxTokens / 50)
          : 20,
        autoPersist: {
          persistAll: true, // Always persist all memories on server
        },
      },
    };

    // Cache the config
    await this.cacheService.setCache(cacheKey, agentConfig, this.CACHE_TTL);

    this.logger.debug(
      `Agent config built and cached for userId=${userId}, leadId=${leadId}`,
    );
    return agentConfig;
  }

  /**
   * Invalidate cached agent config for a specific user and lead
   * Call this when strategy, prompt template, or user settings change
   */
  async invalidateCache(userId: number, leadId: number): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}:${userId}:${leadId}`;
    await this.cacheService.delCache(cacheKey);
    this.logger.debug(
      `Cache invalidated for agent config: userId=${userId}, leadId=${leadId}`,
    );
  }

  /**
   * Invalidate all cached configs for a user (when user settings change)
   */
  invalidateUserCache(userId: number): void {
    // Note: This is a simple implementation. For production, consider using cache tags
    // or pattern-based deletion if your cache supports it
    this.logger.debug(`Cache invalidation requested for user: ${userId}`);
    // Individual invalidation would require tracking all leadIds for a user
    // For now, we'll rely on TTL expiration
  }

  /**
   * Get prompt template for a user (via their subaccount)
   */
  private async getPromptTemplateForUser(userId: number): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { subAccountId: true },
      });

      if (!user?.subAccountId) {
        this.logger.warn(
          `User ${userId} has no subAccountId, using default template`,
        );
        return null;
      }

      return await this.promptTemplatesService.getActive(user.subAccountId);
    } catch (error) {
      this.logger.warn(
        `Failed to get prompt template for user ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get model configuration from environment/prompt template
   * Note: Model is configured at factory level, not per-agent
   */
  getModelConfig(promptTemplate?: any): any {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: promptTemplate?.temperature ?? 0.7,
      maxTokens: promptTemplate?.maxTokens ?? 500,
    };
  }
}
