import { ApiClient } from '../client';
import { ChatMessage, SendMessageDto } from '@/types';

export class ChatApi extends ApiClient {
  async sendMessage(data: SendMessageDto): Promise<ChatMessage> {
    return this.post<ChatMessage>('/chat/send-message', data);
  }

  async getChatHistory(clientId: number): Promise<ChatMessage[]> {
    return this.get<ChatMessage[]>(`/chat/history/${clientId}`);
  }

  async getChatHistoryByDateRange(
    clientId: number, 
    startDate: string, 
    endDate: string
  ): Promise<ChatMessage[]> {
    return this.get<ChatMessage[]>(`/chat/history/${clientId}?startDate=${startDate}&endDate=${endDate}`);
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