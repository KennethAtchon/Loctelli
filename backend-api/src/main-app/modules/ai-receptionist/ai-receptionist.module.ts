import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PromptTemplatesModule } from '../prompt-templates/prompt-templates.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AIReceptionistService } from './ai-receptionist.service';
import { AgentConfigService } from './config/agent-config.service';
import { AgentConfigMapper } from './mappers/agent-config.mapper';
import { BookingToolsVercel } from './tools/booking-tools-vercel';
import { LeadManagementToolsVercel } from './tools/lead-management-tools-vercel';
import { AIReceptionistWebhookController } from './webhook.controller';
import { WebhookSecurityMiddleware } from './webhook-security.middleware';
import { AIReceptionistDevController } from './dev.controller';
import { VercelAIService } from './services/vercel-ai.service';
import { ConversationHistoryService } from './services/conversation-history.service';
import { SystemPromptBuilderService } from './services/system-prompt-builder.service';

@Module({
  imports: [PrismaModule, PromptTemplatesModule, BookingsModule, ConfigModule],
  controllers: [AIReceptionistWebhookController, AIReceptionistDevController],
  providers: [
    AIReceptionistService,
    AgentConfigService,
    AgentConfigMapper,
    BookingToolsVercel,
    LeadManagementToolsVercel,
    WebhookSecurityMiddleware,
    VercelAIService,
    ConversationHistoryService,
    SystemPromptBuilderService,
  ],
  exports: [AIReceptionistService, AgentConfigService, VercelAIService],
})
export class AIReceptionistModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply webhook security middleware to webhook endpoints
    consumer.apply(WebhookSecurityMiddleware).forRoutes({
      path: 'ai-receptionist/webhooks/(.*)',
      method: RequestMethod.ALL,
    });
  }
}
