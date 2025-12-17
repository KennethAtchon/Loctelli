import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AIReceptionistService } from '../ai-receptionist/ai-receptionist.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private aiReceptionistService: AIReceptionistService,
  ) {}

  async sendMessage(chatMessageDto: ChatMessageDto) {
    const { leadId, content, role = 'user', metadata } = chatMessageDto;

    // Find the lead
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        messageHistory: true,
        strategyId: true,
        regularUserId: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // Create the user message object for response
    const userMessage = {
      content,
      role,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    // Generate AI response using AI-receptionist service
    // Pass image data if present in metadata (support multiple images)
    let imageData:
      | { imageBase64: string; imageName?: string; imageType?: string }[]
      | undefined;

    if (
      metadata?.hasImages &&
      metadata?.images &&
      Array.isArray(metadata.images)
    ) {
      // Multiple images
      imageData = metadata.images.map((img: any) => ({
        imageBase64: img.base64,
        imageName: img.name,
        imageType: img.type,
      }));
    } else if (metadata?.hasImage && metadata?.imageBase64) {
      // Single image (backward compatibility)
      imageData = [
        {
          imageBase64: metadata.imageBase64,
          imageName: metadata.imageName,
          imageType: metadata.imageType,
        },
      ];
    }

    const aiResponse = await this.aiReceptionistService.generateTextResponse({
      leadId,
      message: content,
      imageData: imageData && imageData.length > 0 ? imageData : undefined,
      context: {
        userId: lead.regularUserId,
        strategyId: lead.strategyId,
        leadData: lead,
      },
    });

    // Create the AI response object for response
    const aiMessage = {
      content: aiResponse,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      metadata: { generated: true },
    };

    // Get updated lead data
    const updatedLead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        regularUser: true,
        strategy: true,
      },
    });

    const response = {
      userMessage,
      aiMessage,
      lead: updatedLead,
    };

    console.log(`[ChatService] sendMessage response for leadId=${leadId}:`, {
      userMessage: response.userMessage,
      aiMessage: response.aiMessage,
      leadId: response.lead?.id,
    });

    return response;
  }

  async getMessageHistory(leadId: number) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { messageHistory: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    const history = lead.messageHistory
      ? JSON.parse(lead.messageHistory as string)
      : [];
    console.log(`[ChatService] getMessageHistory for leadId=${leadId}:`, {
      rawMessageHistory: lead.messageHistory,
      parsedHistory: history,
      historyLength: history.length,
    });

    return history;
  }

  /**
   * Send a message to a lead identified by customId
   * @param sendMessageDto DTO containing the customId
   * @returns Response with status and message
   */
  async sendMessageByCustomId(sendMessageDto: SendMessageDto) {
    const { customId } = sendMessageDto;

    // Find lead by customId
    const lead = await this.prisma.lead.findFirst({
      where: { customId },
    });

    if (!lead) {
      throw new NotFoundException(`No lead found with customId ${customId}`);
    }

    // Generate a response using AI-receptionist
    const response = await this.aiReceptionistService.generateTextResponse({
      leadId: lead.id,
      message: '',
      context: {
        userId: lead.regularUserId,
        strategyId: lead.strategyId,
      },
    });

    return {
      status: 'success',
      customId,
      message: response,
    };
  }

  /**
   * Handle general chat endpoint that echoes back the received data
   * @param data Any JSON data
   * @returns Object with received data
   */
  handleGeneralChat(data: any) {
    // Simply echo back the received data like in the Python implementation
    return { received: data };
  }

  async clearMessageHistory(leadId: number) {
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        messageHistory: JSON.stringify([]),
        lastMessage: null,
        lastMessageDate: null,
      },
    });
  }
}
