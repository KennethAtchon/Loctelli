import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { HighLevelWebhooksController } from './highlevel-webhooks.controller';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module';
import { AIReceptionistModule } from '../../../modules/ai-receptionist/ai-receptionist.module';
import { TimezoneDetectorService } from '../../../../shared/utils/timezone-detector.service';

@Module({
  imports: [PrismaModule, AIReceptionistModule],
  controllers: [WebhooksController, HighLevelWebhooksController],
  providers: [WebhooksService, TimezoneDetectorService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
