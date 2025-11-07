import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AgentInstanceConfig } from '@atchonk/ai-receptionist';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PromptTemplatesService } from '../prompt-templates/prompt-templates.service';
import { AgentConfigMapper } from './mappers/agent-config.mapper';

/**
 * Service responsible for building agent configurations from database entities
 */
@Injectable()
export class AgentConfigService {
  private readonly logger = new Logger(AgentConfigService.name);

  constructor(
    private prisma: PrismaService,
    private promptTemplatesService: PromptTemplatesService,
    private mapper: AgentConfigMapper
  ) {}

  /**
   * Get agent configuration for a specific user and lead
   */
  async getAgentConfig(userId: number, leadId: number): Promise<AgentInstanceConfig> {
    this.logger.debug(`Getting agent config for userId=${userId}, leadId=${leadId}`);

    // Fetch all required entities
    const [user, lead, promptTemplate] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { subAccount: true }
      }),
      this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { strategy: true }
      }),
      this.getPromptTemplateForUser(userId)
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
      identity: this.mapper.mapIdentity(strategy, promptTemplate, user),
      personality: this.mapper.mapPersonality(strategy, promptTemplate),
      knowledge: this.mapper.mapKnowledge(strategy, promptTemplate, lead),
      goals: this.mapper.mapGoals(strategy, promptTemplate),
      memory: {
        contextWindow: promptTemplate?.maxTokens ? Math.floor(promptTemplate.maxTokens / 50) : 20
      }
    };

    this.logger.debug(`Agent config built successfully for userId=${userId}, leadId=${leadId}`);
    return agentConfig;
  }

  /**
   * Get prompt template for a user (via their subaccount)
   */
  private async getPromptTemplateForUser(userId: number): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { subAccountId: true }
      });

      if (!user?.subAccountId) {
        this.logger.warn(`User ${userId} has no subAccountId, using default template`);
        return null;
      }

      return await this.promptTemplatesService.getActive(user.subAccountId);
    } catch (error) {
      this.logger.warn(`Failed to get prompt template for user ${userId}: ${error.message}`);
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
      maxTokens: promptTemplate?.maxTokens ?? 500
    };
  }
}

