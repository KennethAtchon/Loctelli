import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { streamText, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConversationHistoryService } from './conversation-history.service';
import { SystemPromptBuilderService } from './system-prompt-builder.service';
import { AgentConfigService } from '../config/agent-config.service';
import { BookingToolsVercel } from '../tools/booking-tools-vercel';
import { LeadManagementToolsVercel } from '../tools/lead-management-tools-vercel';
import type { ModelMessage } from 'ai';

interface AIConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
}

/**
 * Vercel AI SDK service for text generation with streaming
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
   * Generate streaming text response
   * Config-based approach: builds config per request, no agent instances
   */
  async streamTextResponse(
    leadId: number,
    message: string,
    userId: number,
    imageData?: Array<{
      imageBase64: string;
      imageName?: string;
      imageType?: string;
    }>,
  ): Promise<ReadableStream> {
    this.logger.debug(
      `Generating streaming response for leadId=${leadId}, userId=${userId}${imageData ? ' with image' : ''}`,
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

      // Build messages array
      const messages: ModelMessage[] = [
        { role: 'system', content: config.systemPrompt },
        ...history,
        // Handle image data if present
        ...(imageData && imageData.length > 0
          ? [
              {
                role: 'user' as const,
                content: [
                  { type: 'text' as const, text: message },
                  ...imageData.map((img) => ({
                    type: 'image' as const,
                    image: img.imageBase64,
                  })),
                ],
              },
            ]
          : [{ role: 'user' as const, content: message }]),
      ];

      // Configure model
      const model = openai(config.model);

      // Build tools for this request
      const tools = this.buildTools(userId, leadId, lead.timezone || undefined);

      // Stream text with tools
      const result = streamText({
        model,
        messages,
        tools,
        onFinish: async ({ text, toolCalls, toolResults }) => {
          // Save assistant message to history after streaming completes
          await this.conversationHistory.saveMessage(leadId, 'assistant', text);

          // Log tool calls if any
          if (toolCalls && toolCalls.length > 0) {
            this.logger.debug(`Tool calls executed: ${toolCalls.length}`);
          }
        },
      });

      // Save user message to history
      await this.conversationHistory.saveMessage(leadId, 'user', message);

      // Convert textStream (AsyncIterableStream) to ReadableStream
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return readableStream;
    } catch (error) {
      this.logger.error(
        `Error generating streaming response for leadId=${leadId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate non-streaming text response
   * Config-based approach: builds config per request, no agent instances
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

      // Build messages array
      const messages: ModelMessage[] = [
        { role: 'system', content: config.systemPrompt },
        ...history,
        // Handle image data if present
        ...(imageData && imageData.length > 0
          ? [
              {
                role: 'user' as const,
                content: [
                  { type: 'text' as const, text: message },
                  ...imageData.map((img) => ({
                    type: 'image' as const,
                    image: img.imageBase64,
                  })),
                ],
              },
            ]
          : [{ role: 'user' as const, content: message }]),
      ];

      // Configure model
      const model = openai(config.model);

      // Build tools for this request
      const tools = this.buildTools(userId, leadId, lead.timezone || undefined);

      // Generate text with tools
      const result = await generateText({
        model,
        messages,
        tools,
      });

      // Save conversation to history
      await this.conversationHistory.saveMessage(leadId, 'user', message);
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
