import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsService } from './sms.service';
import { CsvProcessorService } from './csv-processor.service';
import { CampaignService } from './campaign.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [SmsService, CsvProcessorService, CampaignService],
  exports: [SmsService, CsvProcessorService, CampaignService],
})
export class SmsModule {}