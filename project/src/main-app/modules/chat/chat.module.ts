import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PromptTemplatesModule } from '../prompt-templates/prompt-templates.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ConfigModule } from '@nestjs/config';
import { SecurityModule } from '../../../shared/security/security.module';
import { AIReceptionistModule } from '../ai-receptionist/ai-receptionist.module';

@Module({
  imports: [PrismaModule, PromptTemplatesModule, BookingsModule, ConfigModule, SecurityModule, AIReceptionistModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
