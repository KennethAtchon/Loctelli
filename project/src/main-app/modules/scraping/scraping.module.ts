import { Module, Global } from '@nestjs/common';
import * as Queue from 'bee-queue';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { ScrapingProcessor } from './processors/scraping-processor';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

const SCRAPING_QUEUE = 'SCRAPING_QUEUE';

const scrapingQueueProvider = {
  provide: SCRAPING_QUEUE,
  useFactory: () => {
    return new Queue('scraping', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        // Connection stability settings for Docker environments
        connectTimeout: 60000,
        commandTimeout: 30000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 60000,
        family: 4,
        db: 0,
        enableReadyCheck: false,
      },
      removeOnSuccess: true,
      removeOnFailure: true,
      stallInterval: 30 * 1000, // Increased from 5s to 30s for stability
      delayedDebounce: 5 * 1000,
    });
  },
};

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [ScrapingController],
  providers: [ScrapingService, ScrapingProcessor, scrapingQueueProvider],
  exports: [ScrapingService, SCRAPING_QUEUE],
})
export class ScrapingModule {}