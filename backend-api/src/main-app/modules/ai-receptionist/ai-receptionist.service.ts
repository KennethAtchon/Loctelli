import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AgentConfigService } from './config/agent-config.service';
import { GenerateTextRequestDto, GenerateTextResponseDto } from './dto/index';
import { VercelAIService } from './services/vercel-ai.service';
import { ConversationHistoryService } from './services/conversation-history.service';

// Local Message type (replaces @atchonk/ai-receptionist Message)
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

/**
 * Main service for AI-receptionist integration
 * Now uses Vercel AI SDK via VercelAIService
 */
@Injectable()
export class AIReceptionistService {
  private readonly logger = new Logger(AIReceptionistService.name);

  constructor(
    private prisma: PrismaService,
    private agentConfig: AgentConfigService,
    private vercelAIService: VercelAIService,
    private conversationHistory: ConversationHistoryService,
  ) {}

  /**
   * Generate a text response for a lead message
   * Now uses Vercel AI SDK
   */
  async generateTextResponse(request: GenerateTextRequestDto): Promise<string> {
    const { leadId, message, imageData, context } = request;

    this.logger.debug(
      `Generating text response for leadId=${leadId}${imageData ? ' with image' : ''}`,
    );

    try {
      // Get lead to determine userId
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

      const userId = context?.userId || lead.regularUserId;

      // Use Vercel AI SDK service
      return await this.vercelAIService.generateTextResponse(
        leadId,
        message,
        userId,
        imageData,
      );
    } catch (error) {
      this.logger.error(
        `Error generating text response for leadId=${leadId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate streaming text response
   * Returns a ReadableStream for server-side streaming
   */
  async streamTextResponse(
    request: GenerateTextRequestDto,
  ): Promise<ReadableStream> {
    const { leadId, message, imageData, context } = request;

    this.logger.debug(
      `Generating streaming response for leadId=${leadId}${imageData ? ' with image' : ''}`,
    );

    try {
      // Get lead to determine userId
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

      const userId = context?.userId || lead.regularUserId;

      // Use Vercel AI SDK service for streaming
      return await this.vercelAIService.streamTextResponse(
        leadId,
        message,
        userId,
        imageData,
      );
    } catch (error) {
      this.logger.error(
        `Error generating streaming response for leadId=${leadId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Initiate a conversation with a lead (AI sends first message)
   * Now uses Vercel AI SDK
   */
  async initiateConversation(leadId: number): Promise<string> {
    this.logger.debug(`Initiating conversation for leadId=${leadId}`);

    try {
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

      // Check if conversation already started
      const history = await this.conversationHistory.getHistory(leadId);
      if (history.length > 0) {
        this.logger.warn(`Conversation already initiated for leadId=${leadId}`);
        const lastMessage = history[history.length - 1];
        return typeof lastMessage.content === 'string'
          ? lastMessage.content
          : '';
      }

      // Use Vercel AI SDK to generate initial greeting
      const greeting = await this.vercelAIService.generateTextResponse(
        leadId,
        'Generate a warm, personalized opening message to initiate this conversation. Introduce yourself and express genuine interest in helping them. Keep it friendly and conversational.',
        lead.regularUserId,
      );

      this.logger.debug(`Conversation initiated for leadId=${leadId}`);
      return greeting;
    } catch (error) {
      this.logger.error(
        `Error initiating conversation for leadId=${leadId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get conversation history for a lead
   */
  async getConversationHistory(leadId: number): Promise<Message[]> {
    const history = await this.conversationHistory.getHistory(leadId);

    // Convert to AI-receptionist Message format for backward compatibility
    // Filter to only 'user' and 'assistant' roles
    return history
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg) => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : '',
        timestamp: new Date().toISOString(),
      }));
  }

  /**
   * Clear conversation history for a lead
   */
  async clearConversation(leadId: number): Promise<void> {
    await this.conversationHistory.clearHistory(leadId);
    this.logger.debug(`Cleared conversation history for leadId=${leadId}`);
  }

  /**
   * Save message to database history (for backward compatibility)
   * Now uses ConversationHistoryService
   */
  private async saveMessageToHistory(
    leadId: number,
    userMessage: string,
    aiMessage: string,
    firstMessageRole: 'user' | 'assistant' = 'assistant',
  ): Promise<void> {
    if (firstMessageRole === 'assistant' && !userMessage) {
      await this.conversationHistory.saveMessage(
        leadId,
        'assistant',
        aiMessage,
      );
    } else {
      if (userMessage) {
        await this.conversationHistory.saveMessage(leadId, 'user', userMessage);
      }
      await this.conversationHistory.saveMessage(
        leadId,
        'assistant',
        aiMessage,
      );
    }
  }
}
