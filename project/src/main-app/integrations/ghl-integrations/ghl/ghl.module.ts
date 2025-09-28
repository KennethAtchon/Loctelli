import { Module } from '@nestjs/common';
import { GhlService } from './ghl.service';
import { GhlApiClientService } from './ghl-api-client.service';
import { PrismaModule } from '../../../../shared/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [GhlService, GhlApiClientService],
  exports: [GhlService, GhlApiClientService],
})
export class GhlModule {}
