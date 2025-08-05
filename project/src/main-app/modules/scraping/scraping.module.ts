import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { ScrapingProcessor } from './processors/scraping-processor';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'scraping',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
  ],
  controllers: [ScrapingController],
  providers: [ScrapingService, ScrapingProcessor],
  exports: [ScrapingService],
})
export class ScrapingModule {}