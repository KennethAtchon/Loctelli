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

  async sendMessage(
    data: ChatMessageDto
  ): Promise<{ userMessage: unknown; aiMessage: unknown; lead: unknown }> {
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
    return this.api.getUnreadMessagesCount({ leadId }) as Promise<number>;
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

  /**
   * Send message with streaming response
   * Calls onChunk for each text chunk received
   */
  async sendMessageStream(
    data: ChatMessageDto,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // Use the client's request method but handle streaming manually
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseUrl = (this.client as any).baseUrl;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authHeaders = (this.client as any).authManager.getAuthHeaders();

    const url = `${baseUrl}/api/proxy/chat/send/stream`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Streaming request failed: ${response.statusText} - ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          // Vercel AI SDK data stream format: "0:content" for text chunks
          if (line.startsWith("0:")) {
            const text = line.slice(2);
            fullText += text;
            onChunk(text);
          }
          // Handle other event types if needed (e.g., tool calls, metadata)
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullText;
  }
}
