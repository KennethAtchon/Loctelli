/**
 * Chat API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import { ChatMessage } from "@/types";
import { ChatMessageDto } from "../endpoints/chat";

export const chatConfig: EndpointGroup = {
  sendMessage: {
    method: "POST",
    path: "/chat/send",
    requiresBody: true,
    bodyType: {} as ChatMessageDto,
    responseType: {} as {
      userMessage: unknown;
      aiMessage: unknown;
      lead: unknown;
    },
  },

  getChatHistory: {
    method: "GET",
    path: "/chat/messages/:leadId",
    pathParams: [{ name: "leadId", required: true, type: "number" }],
    responseType: {} as ChatMessage[],
  },

  getChatHistoryByDateRange: {
    method: "GET",
    path: "/chat/messages/:leadId",
    pathParams: [{ name: "leadId", required: true, type: "number" }],
    queryParams: [
      { name: "startDate", required: true, type: "string" },
      { name: "endDate", required: true, type: "string" },
    ],
    responseType: {} as ChatMessage[],
  },

  markMessageAsRead: {
    method: "PATCH",
    path: "/chat/messages/:messageId/read",
    pathParams: [{ name: "messageId", required: true, type: "string" }],
    responseType: undefined as unknown as void,
  },

  deleteMessage: {
    method: "DELETE",
    path: "/chat/messages/:messageId",
    pathParams: [{ name: "messageId", required: true, type: "string" }],
    responseType: undefined as unknown as void,
  },

  getUnreadMessagesCount: {
    method: "GET",
    path: "/chat/unread-count/:leadId",
    pathParams: [{ name: "leadId", required: true, type: "number" }],
    responseType: {} as number,
  },

  markAllAsRead: {
    method: "PATCH",
    path: "/chat/mark-all-read/:leadId",
    pathParams: [{ name: "leadId", required: true, type: "number" }],
    responseType: undefined as unknown as void,
  },

  clearChatHistory: {
    method: "DELETE",
    path: "/chat/messages/lead/:leadId",
    pathParams: [{ name: "leadId", required: true, type: "number" }],
    responseType: undefined as unknown as void,
  },

  initiateConversation: {
    method: "POST",
    path: "/chat/initiate/:leadId",
    pathParams: [{ name: "leadId", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as Record<string, never>,
    responseType: {} as { success: boolean; message: string; leadId: number },
  },
};
