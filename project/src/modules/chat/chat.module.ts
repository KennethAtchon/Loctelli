import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { OpenAIPromptBuilderService } from './openai-prompt-builder.service';
import { PromptHelperService } from './prompt-helper.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, OpenAIPromptBuilderService, PromptHelperService],
  exports: [ChatService, OpenAIPromptBuilderService, PromptHelperService],
})
export class ChatModule {}
