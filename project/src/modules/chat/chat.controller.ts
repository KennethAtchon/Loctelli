import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  sendMessage(@Body() chatMessageDto: ChatMessageDto) {
    return this.chatService.sendMessage(chatMessageDto);
  }

  @Get(':clientId/history')
  getMessageHistory(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.chatService.getMessageHistory(clientId);
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
