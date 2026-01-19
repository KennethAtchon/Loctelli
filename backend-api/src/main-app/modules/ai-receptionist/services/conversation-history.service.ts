import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { ModelMessage, UserModelMessage, AssistantModelMessage } from 'ai';

/**
 * Service for managing conversation history
 * Handles loading and saving messages for AI context
 */
@Injectable()
export class ConversationHistoryService {
  private readonly logger = new Logger(ConversationHistoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get conversation history for a lead
   * @param leadId Lead ID
   * @param maxMessages Maximum number of messages to return (default: 20)
   * @returns Array of CoreMessage for AI SDK
   */
  async getHistory(
    leadId: number,
    maxMessages: number = 20,
  ): Promise<ModelMessage[]> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { messageHistory: true },
    });

    if (!lead?.messageHistory) {
      return [];
    }

    try {
      const history = JSON.parse(lead.messageHistory as string);
      const recentHistory = history.slice(-maxMessages);

      return recentHistory.map((msg: any): ModelMessage => {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        const content = msg.content || msg.message || '';

        if (role === 'user') {
          return {
            role: 'user',
            content: content,
          } satisfies UserModelMessage;
        } else {
          return {
            role: 'assistant',
            content: content,
          } satisfies AssistantModelMessage;
        }
      });
    } catch (error) {
      this.logger.error(
        `Error parsing message history for leadId=${leadId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Save a message to conversation history
   * @param leadId Lead ID
   * @param role Message role ('user' or 'assistant')
   * @param content Message content
   */
  async saveMessage(
    leadId: number,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { messageHistory: true },
    });

    if (!lead) {
      this.logger.warn(`Lead ${leadId} not found, cannot save message`);
      return;
    }

    const existingHistory = lead.messageHistory
      ? JSON.parse(lead.messageHistory as string)
      : [];

    const newMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...existingHistory, newMessage];

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        messageHistory: JSON.stringify(updatedHistory),
        lastMessage: content,
        lastMessageDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Save both user and assistant messages at once
   */
  async saveMessages(
    leadId: number,
    userMessage: string,
    assistantMessage: string,
  ): Promise<void> {
    await this.saveMessage(leadId, 'user', userMessage);
    await this.saveMessage(leadId, 'assistant', assistantMessage);
  }

  /**
   * Clear conversation history for a lead
   */
  async clearHistory(leadId: number): Promise<void> {
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        messageHistory: JSON.stringify([]),
        lastMessage: null,
        lastMessageDate: null,
      },
    });

    this.logger.debug(`Cleared conversation history for leadId=${leadId}`);
  }
}
