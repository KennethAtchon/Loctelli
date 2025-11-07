import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PromptTemplatesModule } from '../prompt-templates/prompt-templates.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AIReceptionistService } from './ai-receptionist.service';
import { AgentFactoryService } from './agent-factory.service';
import { AgentConfigService } from './config/agent-config.service';
import { AgentConfigMapper } from './mappers/agent-config.mapper';
import { BookingTools } from './custom-tools/booking-tools';
import { LeadManagementTools } from './custom-tools/lead-management-tools';
import { GoogleCalendarConfigService } from './config/google-calendar-config.service';
import { AIReceptionistWebhookController } from './webhook.controller';
import { WebhookSecurityMiddleware } from './webhook-security.middleware';

@Module({
  imports: [
    PrismaModule,
    PromptTemplatesModule,
    BookingsModule,
    ConfigModule
  ],
  controllers: [AIReceptionistWebhookController],
  providers: [
    AIReceptionistService,
    AgentFactoryService,
    AgentConfigService,
    AgentConfigMapper,
    BookingTools,
    LeadManagementTools,
    GoogleCalendarConfigService,
    WebhookSecurityMiddleware
  ],
  exports: [
    AIReceptionistService,
    AgentFactoryService,
    AgentConfigService
  ]
})
export class AIReceptionistModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply webhook security middleware to webhook endpoints
    consumer
      .apply(WebhookSecurityMiddleware)
      .forRoutes(
        { path: 'ai-receptionist/webhooks/(.*)', method: RequestMethod.ALL }
      );
  }
}

