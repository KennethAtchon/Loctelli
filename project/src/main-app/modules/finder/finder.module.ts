import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { SharedModule } from '../../../shared/shared.module';
import { AuthModule } from '../../../shared/auth/auth.module';
import { FinderController } from './controllers/finder.controller';
import { BusinessFinderService } from './services/business-finder.service';
import { GooglePlacesService } from './services/google-places.service';
import { YelpService } from './services/yelp.service';
import { OpenStreetMapService } from './services/openstreetmap.service';
import { RateLimitService } from './services/rate-limit.service';
import { ExportService } from './services/export.service';
import { ServiceRegistry } from '../../../shared/job-queue/service-registry';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SharedModule,
    AuthModule,
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
    GooglePlacesService,
    YelpService,
    OpenStreetMapService,
    RateLimitService,
    ExportService,
  ],
})
export class FinderModule implements OnModuleInit {
  constructor(
    private businessFinderService: BusinessFinderService,
    private googlePlacesService: GooglePlacesService,
    private yelpService: YelpService,
    private openStreetMapService: OpenStreetMapService,
    private rateLimitService: RateLimitService,
    private exportService: ExportService,
  ) {}

  onModuleInit() {
    const registry = ServiceRegistry.getInstance();
    
    // Register services with specific methods that can be called via job queue
    registry.registerService('BusinessFinderService', this.businessFinderService, [
      'searchBusinesses',
      'searchBusinessesAsync',
      'getSearchResult',
      'getUserSearchHistory'
    ]);
    
    registry.registerService('GooglePlacesService', this.googlePlacesService, [
      'searchBusinesses'
    ]);
    
    registry.registerService('YelpService', this.yelpService, [
      'searchBusinesses'
    ]);
    
    registry.registerService('OpenStreetMapService', this.openStreetMapService, [
      'searchBusinesses'
    ]);
    
    registry.registerService('ExportService', this.exportService, [
      'exportResults'
    ]);
  }
}