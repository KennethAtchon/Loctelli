import { ChatApi } from '@/lib/api/endpoints/chat'
import { ChatMessageDto } from '@/lib/api/endpoints/chat'
import { ChatMessage } from '@/types'
import { ApiClient } from '@/lib/api/client'

jest.mock('@/lib/logger', () => ({
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

let mockClient: ApiClient;

beforeAll(() => {
  mockClient = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  } as unknown as ApiClient;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ChatApi', () => {
  let chatApi: ChatApi

  beforeEach(() => {
    // Create a new instance
    chatApi = new ChatApi(mockClient)
  })

  describe('sendMessage', () => {
    it('should call send message endpoint with correct data', async () => {
      const messageData: ChatMessageDto = {
        leadId: 1,
        content: 'Hello, I would like to learn more about your services',
        role: 'user',
        metadata: {
          source: 'website',
          timestamp: new Date().toISOString(),
        },
      }

      const mockResponse = {
        userMessage: {
          id: 'msg1',
          leadId: 1,
          message: 'Hello, I would like to learn more about your services',
          sender: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
        aiMessage: {
          id: 'msg2',
          leadId: 1,
          message: 'Thank you for your interest! I would be happy to help you learn more about our services.',
          sender: 'lead' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        },
        lead: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
        },
      }

      mockPost.mockResolvedValue(mockResponse)

      const result = await chatApi.sendMessage(messageData)

      expect(mockPost).toHaveBeenCalledWith('/chat/send', messageData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle send message error', async () => {
      const messageData: ChatMessageDto = {
        leadId: 999, // Invalid lead ID
        content: 'Test message',
      }

      const error = new Error('Lead not found')
      mockPost.mockRejectedValue(error)

      await expect(chatApi.sendMessage(messageData)).rejects.toThrow('Lead not found')
      expect(mockPost).toHaveBeenCalledWith('/chat/send', messageData)
    })

    it('should handle send message with minimal data', async () => {
      const messageData: ChatMessageDto = {
        leadId: 1,
        content: 'Simple message',
      }

      const mockResponse = {
        userMessage: { id: 'msg1', leadId: 1, message: 'Simple message', sender: 'user', timestamp: new Date(), status: 'sent' },
        aiMessage: { id: 'msg2', leadId: 1, message: 'Response', sender: 'lead', timestamp: new Date(), status: 'sent' },
        lead: { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
      }

      mockPost.mockResolvedValue(mockResponse)

      const result = await chatApi.sendMessage(messageData)

      expect(mockPost).toHaveBeenCalledWith('/chat/send', messageData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getChatHistory', () => {
    it('should call get chat history endpoint', async () => {
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg1',
          leadId: 1,
          message: 'Hello, I would like to learn more about your services',
          sender: 'user',
          timestamp: new Date(),
          status: 'read',
        },
        {
          id: 'msg2',
          leadId: 1,
          message: 'Thank you for your interest! I would be happy to help you learn more about our services.',
          sender: 'lead',
          timestamp: new Date(),
          status: 'read',
        },
        {
          id: 'msg3',
          leadId: 1,
          message: 'Can you tell me about your pricing?',
          sender: 'user',
          timestamp: new Date(),
          status: 'delivered',
        },
      ]

      mockGet.mockResolvedValue(mockMessages)

      const result = await chatApi.getChatHistory(1)

      expect(mockGet).toHaveBeenCalledWith('/chat/messages/1')
      expect(result).toEqual(mockMessages)
    })

    it('should handle get chat history error', async () => {
      const error = new Error('Lead not found')
      mockGet.mockRejectedValue(error)

      await expect(chatApi.getChatHistory(999)).rejects.toThrow('Lead not found')
      expect(mockGet).toHaveBeenCalledWith('/chat/messages/999')
    })
  })

  describe('getChatHistoryByDateRange', () => {
    it('should call get chat history by date range endpoint', async () => {
      const leadId = 1
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg1',
          leadId: 1,
          message: 'Message from January',
          sender: 'user',
          timestamp: new Date('2024-01-15'),
          status: 'read',
        },
        {
          id: 'msg2',
          leadId: 1,
          message: 'Response from January',
          sender: 'lead',
          timestamp: new Date('2024-01-15'),
          status: 'read',
        },
      ]

      mockGet.mockResolvedValue(mockMessages)

      const result = await chatApi.getChatHistoryByDateRange(leadId, startDate, endDate)

      expect(mockGet).toHaveBeenCalledWith('/chat/messages/1?startDate=2024-01-01&endDate=2024-01-31')
      expect(result).toEqual(mockMessages)
    })

    it('should handle get chat history by date range error', async () => {
      const leadId = 1
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'
      const error = new Error('Invalid date range')
      mockGet.mockRejectedValue(error)

      await expect(chatApi.getChatHistoryByDateRange(leadId, startDate, endDate)).rejects.toThrow('Invalid date range')
      expect(mockGet).toHaveBeenCalledWith('/chat/messages/1?startDate=2024-01-01&endDate=2024-01-31')
    })
  })

  describe('markMessageAsRead', () => {
    it('should call mark message as read endpoint', async () => {
      const messageId = 'msg1'
      mockPatch.mockResolvedValue(undefined)

      await chatApi.markMessageAsRead(messageId)

      expect(mockPatch).toHaveBeenCalledWith('/chat/messages/msg1/read')
    })

    it('should handle mark message as read error', async () => {
      const messageId = 'invalid-msg'
      const error = new Error('Message not found')
      mockPatch.mockRejectedValue(error)

      await expect(chatApi.markMessageAsRead(messageId)).rejects.toThrow('Message not found')
      expect(mockPatch).toHaveBeenCalledWith('/chat/messages/invalid-msg/read')
    })
  })

  describe('deleteMessage', () => {
    it('should call delete message endpoint', async () => {
      const messageId = 'msg1'
      mockDelete.mockResolvedValue(undefined)

      await chatApi.deleteMessage(messageId)

      expect(mockDelete).toHaveBeenCalledWith('/chat/messages/msg1')
    })

    it('should handle delete message error', async () => {
      const messageId = 'invalid-msg'
      const error = new Error('Message not found')
      mockDelete.mockRejectedValue(error)

      await expect(chatApi.deleteMessage(messageId)).rejects.toThrow('Message not found')
      expect(mockDelete).toHaveBeenCalledWith('/chat/messages/invalid-msg')
    })
  })

  describe('getUnreadMessagesCount', () => {
    it('should call get unread messages count endpoint', async () => {
      const leadId = 1
      const mockCount = 5

      mockGet.mockResolvedValue(mockCount)

      const result = await chatApi.getUnreadMessagesCount(leadId)

      expect(mockGet).toHaveBeenCalledWith('/chat/unread-count/1')
      expect(result).toEqual(mockCount)
    })

    it('should handle get unread messages count error', async () => {
      const leadId = 999
      const error = new Error('Lead not found')
      mockGet.mockRejectedValue(error)

      await expect(chatApi.getUnreadMessagesCount(leadId)).rejects.toThrow('Lead not found')
      expect(mockGet).toHaveBeenCalledWith('/chat/unread-count/999')
    })

    it('should handle zero unread messages', async () => {
      const leadId = 1
      const mockCount = 0

      mockGet.mockResolvedValue(mockCount)

      const result = await chatApi.getUnreadMessagesCount(leadId)

      expect(mockGet).toHaveBeenCalledWith('/chat/unread-count/1')
      expect(result).toEqual(0)
    })
  })

  describe('markAllAsRead', () => {
    it('should call mark all as read endpoint', async () => {
      const leadId = 1
      mockPatch.mockResolvedValue(undefined)

      await chatApi.markAllAsRead(leadId)

      expect(mockPatch).toHaveBeenCalledWith('/chat/mark-all-read/1')
    })

    it('should handle mark all as read error', async () => {
      const leadId = 999
      const error = new Error('Lead not found')
      mockPatch.mockRejectedValue(error)

      await expect(chatApi.markAllAsRead(leadId)).rejects.toThrow('Lead not found')
      expect(mockPatch).toHaveBeenCalledWith('/chat/mark-all-read/999')
    })
  })

  describe('clearChatHistory', () => {
    it('should call clear chat history endpoint', async () => {
      const leadId = 1
      mockDelete.mockResolvedValue(undefined)

      await chatApi.clearChatHistory(leadId)

      expect(mockDelete).toHaveBeenCalledWith('/chat/messages/lead/1')
    })

    it('should handle clear chat history error', async () => {
      const leadId = 999
      const error = new Error('Lead not found')
      mockDelete.mockRejectedValue(error)

      await expect(chatApi.clearChatHistory(leadId)).rejects.toThrow('Lead not found')
      expect(mockDelete).toHaveBeenCalledWith('/chat/messages/lead/999')
    })
  })

  describe('Type Safety', () => {
    it('should enforce correct ChatMessageDto structure', () => {
      const validChatMessageDto: ChatMessageDto = {
        leadId: 1,
        content: 'Test message',
        role: 'user',
        metadata: {
          source: 'website',
          timestamp: new Date().toISOString(),
        },
      }

      expect(validChatMessageDto).toHaveProperty('leadId')
      expect(validChatMessageDto).toHaveProperty('content')
    })

    it('should enforce correct ChatMessage structure', () => {
      const validChatMessage: ChatMessage = {
        id: 'msg1',
        leadId: 1,
        message: 'Test message',
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
      }

      expect(validChatMessage).toHaveProperty('id')
      expect(validChatMessage).toHaveProperty('leadId')
      expect(validChatMessage).toHaveProperty('message')
      expect(validChatMessage).toHaveProperty('sender')
      expect(validChatMessage).toHaveProperty('timestamp')
      expect(validChatMessage).toHaveProperty('status')
    })

    it('should handle different sender types', () => {
      const userMessage: ChatMessage = {
        id: 'msg1',
        leadId: 1,
        message: 'User message',
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
      }

      const leadMessage: ChatMessage = {
        id: 'msg2',
        leadId: 1,
        message: 'Lead message',
        sender: 'lead',
        timestamp: new Date(),
        status: 'sent',
      }

      expect(userMessage.sender).toBe('user')
      expect(leadMessage.sender).toBe('lead')
    })

    it('should handle different status types', () => {
      const sentMessage: ChatMessage = {
        id: 'msg1',
        leadId: 1,
        message: 'Sent message',
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
      }

      const deliveredMessage: ChatMessage = {
        id: 'msg2',
        leadId: 1,
        message: 'Delivered message',
        sender: 'user',
        timestamp: new Date(),
        status: 'delivered',
      }

      const readMessage: ChatMessage = {
        id: 'msg3',
        leadId: 1,
        message: 'Read message',
        sender: 'user',
        timestamp: new Date(),
        status: 'read',
      }

      expect(sentMessage.status).toBe('sent')
      expect(deliveredMessage.status).toBe('delivered')
      expect(readMessage.status).toBe('read')
    })
  })
}) 