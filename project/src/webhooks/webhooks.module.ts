import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { HighLevelWebhooksController } from './highlevel-webhooks.controller';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController, HighLevelWebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
