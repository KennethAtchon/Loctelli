import { ApiClient } from "../client";
import { ChatMessage } from "@/types";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { chatConfig } from "../config/chat.config";

export interface ChatMessageDto {
  leadId: number;
  content: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export class ChatApi {
  private api: EndpointApi<typeof chatConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(chatConfig);
  }

  async sendMessage(data: ChatMessageDto): Promise<{
    userMessage: unknown;
    aiMessage: unknown;
    lead: unknown;
  }> {
    return this.api.sendMessage(undefined, data) as Promise<{
      userMessage: unknown;
      aiMessage: unknown;
      lead: unknown;
    }>;
  }

  async getChatHistory(leadId: number): Promise<ChatMessage[]> {
    return this.api.getChatHistory({ leadId }) as Promise<ChatMessage[]>;
  }

  async getChatHistoryByDateRange(
    leadId: number,
    startDate: string,
    endDate: string
  ): Promise<ChatMessage[]> {
    return this.api.getChatHistoryByDateRange({
      leadId,
      startDate,
      endDate,
    }) as Promise<ChatMessage[]>;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    return this.api.markMessageAsRead({ messageId }) as Promise<void>;
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.api.deleteMessage({ messageId }) as Promise<void>;
  }

  async getUnreadMessagesCount(leadId: number): Promise<number> {
    return this.api.getUnreadMessagesCount({
      leadId,
    }) as Promise<number>;
  }

  async markAllAsRead(leadId: number): Promise<void> {
    return this.api.markAllAsRead({ leadId }) as Promise<void>;
  }

  async clearChatHistory(leadId: number): Promise<void> {
    return this.api.clearChatHistory({ leadId }) as Promise<void>;
  }

  async initiateConversation(
    leadId: number
  ): Promise<{ success: boolean; message: string; leadId: number }> {
    return this.api.initiateConversation({ leadId }, {}) as Promise<{
      success: boolean;
      message: string;
      leadId: number;
    }>;
  }
}
