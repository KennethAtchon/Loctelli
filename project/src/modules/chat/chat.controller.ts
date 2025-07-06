import { Controller, Post, Body, Get, Param, ParseIntPipe, HttpException, HttpStatus, Patch, Delete, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService
  ) {}

  @Post('send')
  async sendMessage(@Body() chatMessageDto: ChatMessageDto, @CurrentUser() user) {
    // Check if the lead belongs to the current user
    const lead = await this.prisma.lead.findUnique({
      where: { id: chatMessageDto.leadId },
    });
    
    if (!lead) {
      throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && lead.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    return this.chatService.sendMessage(chatMessageDto);
  }

  @Get('messages/:leadId')
  async getMessages(@Param('leadId', ParseIntPipe) leadId: number, @CurrentUser() user) {
    // Check if the lead belongs to the current user
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });
    
    if (!lead) {
      throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && lead.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    return this.chatService.getMessageHistory(leadId);
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

  @Get('unread-count/:leadId')
  async getUnreadMessagesCount(@Param('leadId', ParseIntPipe) leadId: number, @CurrentUser() user) {
    // Check if the lead belongs to the current user
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });
    
    if (!lead) {
      throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && lead.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    // TODO: Implement unread count logic
    // This would require adding a messages table to track individual messages
    return 0;
  }

  @Patch('mark-all-read/:leadId')
  async markAllAsRead(@Param('leadId', ParseIntPipe) leadId: number, @CurrentUser() user) {
    // Check if the lead belongs to the current user
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });
    
    if (!lead) {
      throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin' && lead.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    
    // TODO: Implement mark all as read logic
    // This would require adding a messages table to track individual messages
    return { message: 'All messages marked as read' };
  }

  @Post('send_message')
  @Public()
  sendMessageByCustomId(@Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessageByCustomId(sendMessageDto);
  }

  @Post('general')
  @Public()
  generalChatEndpoint(@Body() data: any) {
    return this.chatService.handleGeneralChat(data);
  }

  @Delete('messages/lead/:leadId')
  async clearLeadMessages(@Param('leadId', ParseIntPipe) leadId: number, @CurrentUser() user) {
    // Check if the lead belongs to the current user
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });
    if (!lead) {
      throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
    }
    if (user.role !== 'admin' && user.role !== 'super_admin' && lead.userId !== user.userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    await this.chatService.clearMessageHistory(leadId);
    return { message: 'Chat history cleared' };
  }
}
