import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module';
import { GhlModule } from '../../ghl-integrations/ghl/ghl.module';

@Module({
  imports: [PrismaModule, GhlModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {} 