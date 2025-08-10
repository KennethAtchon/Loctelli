import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { FinderController } from './controllers/finder.controller';
import { BusinessFinderService } from './services/business-finder.service';
import { GooglePlacesService } from './services/google-places.service';
import { YelpService } from './services/yelp.service';
import { OpenStreetMapService } from './services/openstreetmap.service';
import { RateLimitService } from './services/rate-limit.service';
import { ExportService } from './services/export.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [FinderController],
  providers: [
    BusinessFinderService,
    GooglePlacesService,
    YelpService,
    OpenStreetMapService,
    RateLimitService,
    ExportService,
  ],
  exports: [
    BusinessFinderService,
    RateLimitService,
  ],
})
export class FinderModule {}