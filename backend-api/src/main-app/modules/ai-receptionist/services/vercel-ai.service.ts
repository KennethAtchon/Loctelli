import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConversationHistoryService } from './conversation-history.service';
import { SystemPromptBuilderService } from './system-prompt-builder.service';
import { AgentConfigService } from '../config/agent-config.service';
import { BookingToolsVercel } from '../tools/booking-tools-vercel';
import { LeadManagementToolsVercel } from '../tools/lead-management-tools-vercel';
import type {
  UserModelMessage,
  AssistantModelMessage,
  TextPart,
  ImagePart,
  ModelMessage,
  LanguageModel,
  SystemModelMessage,
} from 'ai';

interface AIConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
}

/**
 * Vercel AI SDK service for text generation
 * Config-based approach: builds config per request, no agent instances
 */
@Injectable()
export class VercelAIService {
  private readonly logger = new Logger(VercelAIService.name);

  constructor(
    private prisma: PrismaService,
    private conversationHistory: ConversationHistoryService,
    private systemPromptBuilder: SystemPromptBuilderService,
    private agentConfig: AgentConfigService,
    private bookingTools: BookingToolsVercel,
    private leadManagementTools: LeadManagementToolsVercel,
  ) {}

  /**
   * Generate non-streaming text response
   * Config-based approach: builds config per request, no agent instances
   * @param saveUserMessage If false, skips saving the user message to history (useful for system prompts)
   */
  async generateTextResponse(
    leadId: number,
    message: string,
    userId: number,
    imageData?: Array<{
      imageBase64: string;
      imageName?: string;
      imageType?: string;
    }>,
    saveUserMessage: boolean = true,
  ): Promise<string> {
    this.logger.debug(
      `Generating non-streaming response for leadId=${leadId}, userId=${userId}${imageData ? ' with image' : ''}`,
    );

    try {
      // Verify lead exists
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          regularUser: true,
          strategy: true,
        },
      });

      if (!lead) {
        throw new NotFoundException(`Lead with ID ${leadId} not found`);
      }

      // Build config for this request
      const config = await this.buildConfig(userId, leadId);

      // Get conversation history (memory)
      const history = await this.conversationHistory.getHistory(
        leadId,
        config.contextWindow,
      );

      // Build messages array (history + current user message) with strict typing
      const currentUserMessage: UserModelMessage =
        imageData && imageData.length > 0
          ? {
              role: 'user',
              content: [
                { type: 'text', text: message } satisfies TextPart,
                ...imageData.map(
                  (img): ImagePart => ({
                    type: 'image',
                    image: img.imageBase64,
                    ...(img.imageType && { mediaType: img.imageType }),
                  }),
                ),
              ],
            }
          : {
              role: 'user',
              content: message,
            };

      const messages: ModelMessage[] = [...history, currentUserMessage];

      // Configure model with strict typing
      const model: LanguageModel = openai(config.model);

      // Build tools for this request
      const tools = this.buildTools(userId, leadId, lead.timezone || undefined);

      this.logger.debug(
        `[generateTextResponse] tools: ${JSON.stringify(tools)}`,
      );

      // Save user message to history BEFORE generating response (correct chronological order)
      // Skip if this is a system prompt (e.g., for initiateConversation)
      if (saveUserMessage) {
        await this.conversationHistory.saveMessage(leadId, 'user', message);
      }

      // Generate text with tools
      const result = await generateText({
        model: model satisfies LanguageModel,
        system: config.systemPrompt satisfies
          | string
          | SystemModelMessage
          | SystemModelMessage[],
        messages: messages satisfies ModelMessage[],
        tools,
      });

      // Save assistant message to history after generation completes
      await this.conversationHistory.saveMessage(
        leadId,
        'assistant',
        result.text,
      );

      this.logger.debug(
        `Generated response for leadId=${leadId}: ${result.text.substring(0, 50)}...`,
      );
      return result.text;
    } catch (error) {
      this.logger.error(
        `Error generating non-streaming response for leadId=${leadId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Build AI configuration for this request
   * Fetches strategy, prompt template, and builds config
   */
  private async buildConfig(userId: number, leadId: number): Promise<AIConfig> {
    // Get agent configuration from database
    const agentConfig = await this.agentConfig.getAgentConfig(userId, leadId);
    const modelConfig = this.agentConfig.getModelConfig();

    // Build system prompt from config
    const systemPrompt =
      this.systemPromptBuilder.buildSystemPrompt(agentConfig);

    return {
      systemPrompt,
      model: modelConfig.model || 'gpt-4o-mini',
      temperature: modelConfig.temperature ?? 0.7,
      maxTokens: modelConfig.maxTokens ?? 500,
      contextWindow: agentConfig.memory?.contextWindow || 20,
    };
  }

  /**
   * Build tools for this request
   * Tools are built with userId and leadId in closure
   */
  private buildTools(
    userId: number,
    leadId: number,
    leadTimezone?: string,
  ): Record<string, any> {
    return {
      book_meeting: this.bookingTools.createBookMeetingTool(
        userId,
        leadId,
        leadTimezone,
      ),
      check_availability: this.bookingTools.createCheckAvailabilityTool(userId),
      update_lead_details:
        this.leadManagementTools.createUpdateLeadDetailsTool(leadId),
      update_conversation_state:
        this.leadManagementTools.createUpdateConversationStateTool(leadId),
    };
  }
}
