/**
 * AI Receptionist Test Module
 *
 * Standalone module for testing AI Receptionist SDK
 * NO integration with existing backend modules
 */

import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AIReceptionistTestController } from './ai-receptionist-test.controller';
import { AIReceptionistTestService } from './ai-receptionist-test.service';
import { WebhookSecurityMiddleware } from './webhook-security.middleware';

@Module({
  controllers: [AIReceptionistTestController],
  providers: [AIReceptionistTestService, WebhookSecurityMiddleware],
  exports: [AIReceptionistTestService]
})
export class AIReceptionistTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply webhook security only to webhook endpoints
    consumer
      .apply(WebhookSecurityMiddleware)
      .forRoutes(
        { path: 'ai-receptionist/webhooks/*', method: RequestMethod.ALL }
      );
  }
}
