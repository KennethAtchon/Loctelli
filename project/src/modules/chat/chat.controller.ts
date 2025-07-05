import { Controller, Post, Body, Get, Param, ParseIntPipe, HttpException, HttpStatus, Patch, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService
  ) {}

  @Post('send')
  async sendMessage(@Body() chatMessageDto: ChatMessageDto, @CurrentUser() user) {
    // Check if the client belongs to the current user
    const client = await this.prisma.client.findUnique({
      where: { id: chatMessageDto.clientId },
    });
    
    if (!client) {
      throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && client.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    return this.chatService.sendMessage(chatMessageDto);
  }

  @Get('messages/:clientId')
  async getMessages(@Param('clientId', ParseIntPipe) clientId: number, @CurrentUser() user) {
    // Check if the client belongs to the current user
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && client.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    return this.chatService.getMessageHistory(clientId);
  }

  @Patch('messages/:messageId/read')
  async markMessageAsRead(@Param('messageId') messageId: string, @CurrentUser() user) {
    // TODO: Implement message read status tracking
    // This would require adding a messages table to track individual messages
    return { message: 'Message marked as read' };
  }

  @Delete('messages/:messageId')
  async deleteMessage(@Param('messageId') messageId: string, @CurrentUser() user) {
    // TODO: Implement message deletion
    // This would require adding a messages table to track individual messages
    return { message: 'Message deleted' };
  }

  @Get('unread-count/:clientId')
  async getUnreadMessagesCount(@Param('clientId', ParseIntPipe) clientId: number, @CurrentUser() user) {
    // Check if the client belongs to the current user
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && client.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    // TODO: Implement unread count logic
    // This would require adding a messages table to track individual messages
    return 0;
  }

  @Patch('mark-all-read/:clientId')
  async markAllAsRead(@Param('clientId', ParseIntPipe) clientId: number, @CurrentUser() user) {
    // Check if the client belongs to the current user
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && client.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    // TODO: Implement mark all as read logic
    // This would require adding a messages table to track individual messages
    return { message: 'All messages marked as read' };
  }

  @Post('send_message')
  sendMessageByCustomId(@Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessageByCustomId(sendMessageDto);
  }

  @Post('general')
  generalChatEndpoint(@Body() data: any) {
    return this.chatService.handleGeneralChat(data);
  }
}
