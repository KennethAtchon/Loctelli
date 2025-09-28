import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { OpenAIPromptBuilderService } from './openai-prompt-builder.service';
import { PromptHelperService } from './prompt-helper.service';
import { SalesBotService } from './sales-bot.service';
import { ConversationSummarizerService } from './conversation-summarizer.service';
import { AiToolsService } from './ai-tools.service';
import { PromptTemplatesModule } from '../prompt-templates/prompt-templates.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ConfigModule } from '@nestjs/config';
import { SecurityModule } from '../../../shared/security/security.module';

@Module({
  imports: [PrismaModule, PromptTemplatesModule, BookingsModule, ConfigModule, SecurityModule],
  controllers: [ChatController],
  providers: [ChatService, OpenAIPromptBuilderService, PromptHelperService, SalesBotService, ConversationSummarizerService, AiToolsService],
  exports: [ChatService, OpenAIPromptBuilderService, PromptHelperService, SalesBotService, ConversationSummarizerService, AiToolsService],
})
export class ChatModule {}
