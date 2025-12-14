import { ApiClient } from "../client";
import { ChatMessage } from "@/types";

export interface ChatMessageDto {
  leadId: number;
  content: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export class ChatApi {
  constructor(private client: ApiClient) {}

  async sendMessage(
    data: ChatMessageDto
  ): Promise<{ userMessage: unknown; aiMessage: unknown; lead: unknown }> {
    return this.client.post<{
      userMessage: unknown;
      aiMessage: unknown;
      lead: unknown;
    }>("/chat/send", data);
  }

  async getChatHistory(leadId: number): Promise<ChatMessage[]> {
    return this.client.get<ChatMessage[]>(`/chat/messages/${leadId}`);
  }

  async getChatHistoryByDateRange(
    leadId: number,
    startDate: string,
    endDate: string
  ): Promise<ChatMessage[]> {
    return this.client.get<ChatMessage[]>(
      `/chat/messages/${leadId}?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    return this.client.patch<void>(`/chat/messages/${messageId}/read`);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.client.delete<void>(`/chat/messages/${messageId}`);
  }

  async getUnreadMessagesCount(leadId: number): Promise<number> {
    return this.client.get<number>(`/chat/unread-count/${leadId}`);
  }

  async markAllAsRead(leadId: number): Promise<void> {
    return this.client.patch<void>(`/chat/mark-all-read/${leadId}`);
  }

  async clearChatHistory(leadId: number): Promise<void> {
    return this.client.delete<void>(`/chat/messages/lead/${leadId}`);
  }

  async initiateConversation(
    leadId: number
  ): Promise<{ success: boolean; message: string; leadId: number }> {
    return this.client.post<{
      success: boolean;
      message: string;
      leadId: number;
    }>(`/chat/initiate/${leadId}`, {});
  }
}
