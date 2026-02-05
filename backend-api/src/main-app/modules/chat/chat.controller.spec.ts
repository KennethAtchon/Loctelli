/* eslint-disable @typescript-eslint/await-thenable */
import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;
  let prismaService: PrismaService;

  const mockChatService = {
    sendMessage: mock(),
    getMessageHistory: mock(),
    sendMessageByCustomId: mock(),
    handleGeneralChat: mock(),
    clearMessageHistory: mock(),
  };

  const mockPrismaService = {
    lead: {
      findUnique: mock(),
    },
  };

  const mockUser = {
    userId: 1,
    role: 'user',
  };

  const mockAdminUser = {
    userId: 999,
    role: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // Bun mocks cleared automatically;
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    const chatMessageDto: ChatMessageDto = {
      leadId: 1,
      content: 'Hello, I need help',
      role: 'user',
    };

    const mockLead = {
      id: 1,
      userId: 1,
    } as any;

    const mockResponse = {
      userMessage: { content: 'Hello', role: 'user' },
      aiMessage: { content: 'Hi there!', role: 'assistant' },
      lead: { id: 1 },
    } as any;

    test('should send message when user owns the lead', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const result = await controller.sendMessage(chatMessageDto, mockUser);

      expect(result).toEqual(mockResponse);
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(chatMessageDto);
    });

    test('should send message when user is admin', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const result = await controller.sendMessage(
        chatMessageDto,
        mockAdminUser,
      );

      expect(result).toEqual(mockResponse);
    });

    test('should throw HttpException when lead not found', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(null);

      await expect(
        async () => await controller.sendMessage(chatMessageDto, mockUser),
      ).rejects.toThrow(HttpException);
    });

    test('should throw HttpException when user does not have access', async () => {
      const leadWithDifferentUser = { ...mockLead, userId: 2 };
      mockPrismaService.lead.findUnique.mockResolvedValue(
        leadWithDifferentUser,
      );

      await expect(
        async () => await controller.sendMessage(chatMessageDto, mockUser),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getMessages', () => {
    const mockLead = {
      id: 1,
      userId: 1,
    } as any;

    const mockMessages = [
      { role: 'user', content: 'Hello', timestamp: '2023-01-01T00:00:00Z' },
      {
        role: 'assistant',
        content: 'Hi there!',
        timestamp: '2023-01-01T00:01:00Z',
      },
    ] as any[];

    test('should get messages when user owns the lead', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockChatService.getMessageHistory.mockResolvedValue(mockMessages);

      const result = await controller.getMessages(1, mockUser);

      expect(result).toEqual(mockMessages as any);
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockChatService.getMessageHistory).toHaveBeenCalledWith(1);
    });

    test('should get messages when user is admin', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockChatService.getMessageHistory.mockResolvedValue(mockMessages);

      const result = await controller.getMessages(1, mockAdminUser);

      expect(result).toEqual(mockMessages as any);
    });

    test('should throw HttpException when lead not found', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(null);

      await expect(
        async () => await controller.getMessages(999, mockUser),
      ).rejects.toThrow(HttpException);
    });

    test('should throw HttpException when user does not have access', async () => {
      const leadWithDifferentUser = { ...mockLead, userId: 2 };
      mockPrismaService.lead.findUnique.mockResolvedValue(
        leadWithDifferentUser,
      );

      await expect(
        async () => await controller.getMessages(1, mockUser),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('markMessageAsRead', () => {
    test('should return placeholder response', () => {
      const result = controller.markMessageAsRead('message-123', mockUser);

      expect(result).toEqual({ message: 'Message marked as read' });
    });
  });

  describe('deleteMessage', () => {
    test('should return placeholder response', () => {
      const result = controller.deleteMessage('message-123', mockUser);

      expect(result).toEqual({ message: 'Message deleted' });
    });
  });

  describe('getUnreadMessagesCount', () => {
    const mockLead = {
      id: 1,
      userId: 1,
    } as any;

    test('should return unread count when user owns the lead', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);

      const result = await controller.getUnreadMessagesCount(1, mockUser);

      expect(result).toBe(0);
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should return unread count when user is admin', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);

      const result = await controller.getUnreadMessagesCount(1, mockAdminUser);

      expect(result).toBe(0);
    });

    test('should throw HttpException when lead not found', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(null);

      await expect(
        async () => await controller.getUnreadMessagesCount(999, mockUser),
      ).rejects.toThrow(HttpException);
    });

    test('should throw HttpException when user does not have access', async () => {
      const leadWithDifferentUser = { ...mockLead, userId: 2 };
      mockPrismaService.lead.findUnique.mockResolvedValue(
        leadWithDifferentUser,
      );

      await expect(
        async () => await controller.getUnreadMessagesCount(1, mockUser),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('markAllAsRead', () => {
    const mockLead = {
      id: 1,
      userId: 1,
    } as any;

    test('should mark all as read when user owns the lead', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);

      const result = await controller.markAllAsRead(1, mockUser);

      expect(result).toEqual({ message: 'All messages marked as read' });
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should mark all as read when user is admin', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);

      const result = await controller.markAllAsRead(1, mockAdminUser);

      expect(result).toEqual({ message: 'All messages marked as read' });
    });

    test('should throw HttpException when lead not found', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(null);

      await expect(
        async () => await controller.markAllAsRead(999, mockUser),
      ).rejects.toThrow(HttpException);
    });

    test('should throw HttpException when user does not have access', async () => {
      const leadWithDifferentUser = { ...mockLead, userId: 2 };
      mockPrismaService.lead.findUnique.mockResolvedValue(
        leadWithDifferentUser,
      );

      await expect(
        async () => await controller.markAllAsRead(1, mockUser),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('sendMessageByCustomId', () => {
    const sendMessageDto: SendMessageDto = {
      customId: 'custom-123',
    };

    const mockResponse = {
      status: 'success',
      customId: 'custom-123',
      message: 'Thank you for your message.',
    } as any;

    test('should send message by custom ID', async () => {
      mockChatService.sendMessageByCustomId.mockResolvedValue(mockResponse);

      const result = await controller.sendMessageByCustomId(sendMessageDto);

      expect(result).toEqual(mockResponse);
      expect(mockChatService.sendMessageByCustomId).toHaveBeenCalledWith(
        sendMessageDto,
      );
    });
  });

  describe('generalChatEndpoint', () => {
    const testData = { message: 'Hello', userId: 123 };

    test('should handle general chat', () => {
      const mockResponse = { received: testData } as any;
      mockChatService.handleGeneralChat.mockResolvedValue(mockResponse);

      const result = controller.generalChatEndpoint(testData);

      expect(result).toEqual(mockResponse);
      expect(mockChatService.handleGeneralChat).toHaveBeenCalledWith(testData);
    });
  });

  describe('clearLeadMessages', () => {
    const mockLead = {
      id: 1,
      userId: 1,
    } as any;

    test('should clear lead messages when user owns the lead', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockChatService.clearMessageHistory.mockResolvedValue(undefined);

      const result = await controller.clearLeadMessages(1, mockUser);

      expect(result).toEqual({ message: 'Chat history cleared' });
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockChatService.clearMessageHistory).toHaveBeenCalledWith(1);
    });

    test('should clear lead messages when user is admin', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockChatService.clearMessageHistory.mockResolvedValue(undefined);

      const result = await controller.clearLeadMessages(1, mockAdminUser);

      expect(result).toEqual({ message: 'Chat history cleared' });
    });

    test('should throw HttpException when lead not found', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(null);

      await expect(
        async () => await controller.clearLeadMessages(999, mockUser),
      ).rejects.toThrow(HttpException);
    });

    test('should throw HttpException when user does not have access', async () => {
      const leadWithDifferentUser = { ...mockLead, userId: 2 };
      mockPrismaService.lead.findUnique.mockResolvedValue(
        leadWithDifferentUser,
      );

      await expect(
        async () => await controller.clearLeadMessages(1, mockUser),
      ).rejects.toThrow(HttpException);
    });
  });
});
