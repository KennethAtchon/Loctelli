import { ApiClient } from '../client';
import { ChatMessage } from '@/types';

export interface ChatMessageDto {
  clientId: number;
  content: string;
  role?: string;
  metadata?: Record<string, any>;
}

export class ChatApi extends ApiClient {
  async sendMessage(data: ChatMessageDto): Promise<{ userMessage: any; aiMessage: any; client: any }> {
    return this.post<{ userMessage: any; aiMessage: any; client: any }>('/chat', data);
  }

  async getChatHistory(clientId: number): Promise<ChatMessage[]> {
    return this.get<ChatMessage[]>(`/chat/${clientId}/history`);
  }

  async getChatHistoryByDateRange(
    clientId: number, 
    startDate: string, 
    endDate: string
  ): Promise<ChatMessage[]> {
    return this.get<ChatMessage[]>(`/chat/${clientId}/history?startDate=${startDate}&endDate=${endDate}`);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    return this.patch<void>(`/chat/messages/${messageId}/read`);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.delete<void>(`/chat/messages/${messageId}`);
  }

  async getUnreadMessagesCount(clientId: number): Promise<number> {
    return this.get<number>(`/chat/unread-count/${clientId}`);
  }

  async markAllAsRead(clientId: number): Promise<void> {
    return this.patch<void>(`/chat/mark-all-read/${clientId}`);
  }
} 