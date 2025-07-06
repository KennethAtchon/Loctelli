import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SalesBotService } from '../../background/bgprocess/sales-bot.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SalesBotService))
    private salesBotService: SalesBotService
  ) {}

  async sendMessage(chatMessageDto: ChatMessageDto) {
    const { clientId, content, role = 'user', metadata } = chatMessageDto;
    
    // Find the client
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, messageHistory: true, strategyId: true, userId: true }
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Create the user message object for response
    const userMessage = {
      content,
      role,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    // Generate AI response using SalesBotService (this will handle message history)
    const aiResponse = await this.salesBotService.generateResponse(content, clientId);
    
    // Create the AI response object for response
    const aiMessage = {
      content: aiResponse,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      metadata: { generated: true }
    };

    // Get updated client data
    const updatedClient = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true,
        strategy: true,
      }
    });

    return {
      userMessage,
      aiMessage,
      client: updatedClient
    };
  }

  async getMessageHistory(clientId: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { messageHistory: true }
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return client.messageHistory ? JSON.parse(client.messageHistory as string) : [];
  }

  /**
   * Send a message to a client identified by customId
   * @param sendMessageDto DTO containing the customId
   * @returns Response with status and message
   */
  async sendMessageByCustomId(sendMessageDto: SendMessageDto) {
    const { customId } = sendMessageDto;
    
    // Find client by customId
    const client = await this.prisma.client.findFirst({
      where: { customId },
    });
    
    if (!client) {
      throw new NotFoundException(`No client found with customId ${customId}`);
    }
    
    // Generate a response using an empty string as the message
    // This simulates the behavior of the Python implementation
    const response = await this.generateResponse('', client.id);
    
    return {
      status: 'success',
      customId,
      message: response
    };
  }
  
  /**
   * Generate a response to a client message
   * This is a placeholder for the actual AI response generation
   * @param message The message to respond to
   * @param clientId The client ID
   * @returns The generated response
   */
  private async generateResponse(message: string, clientId: number): Promise<string> {
    // In a real implementation, this would call your AI service
    // For now, we'll return a simple response
    return `Thank you for your message. Our team will get back to you shortly.`;
  }

  /**
   * Handle general chat endpoint that echoes back the received data
   * @param data Any JSON data
   * @returns Object with received data
   */
  async handleGeneralChat(data: any) {
    // Simply echo back the received data like in the Python implementation
    return { received: data };
  }
}
