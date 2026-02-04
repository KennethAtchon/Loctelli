import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { ProfileEstimationAIService } from './services/profile-estimation-ai.service';
import { FormAnalyticsService } from './services/form-analytics.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../../shared/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [FormsController],
  providers: [FormsService, ProfileEstimationAIService, FormAnalyticsService],
  exports: [FormsService],
})
export class FormsModule {}
