import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { OpenAIPromptBuilderService } from './openai-prompt-builder.service';
import { PromptHelperService } from './prompt-helper.service';
import { BgProcessModule } from '../../background/bgprocess/bgprocess.module';

@Module({
  imports: [PrismaModule, forwardRef(() => BgProcessModule)],
  controllers: [ChatController],
  providers: [ChatService, OpenAIPromptBuilderService, PromptHelperService],
  exports: [ChatService, OpenAIPromptBuilderService, PromptHelperService],
})
export class ChatModule {}
