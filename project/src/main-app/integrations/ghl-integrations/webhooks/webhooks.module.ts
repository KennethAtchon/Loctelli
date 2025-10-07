import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { HighLevelWebhooksController } from './highlevel-webhooks.controller';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module';
import { ChatModule } from '../../../modules/chat/chat.module';
import { TimezoneDetectorService } from '../../../../shared/utils/timezone-detector.service';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [WebhooksController, HighLevelWebhooksController],
  providers: [WebhooksService, TimezoneDetectorService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
