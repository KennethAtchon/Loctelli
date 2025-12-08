import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Shared infrastructure
import { SharedModule } from '../shared/shared.module';
import { ConfigService } from '@nestjs/config';

// Main app modules
import { MainAppModule } from '../main-app/main-app.module';

// Throttler
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Guards and middleware
import { JwtAuthGuard } from '../shared/auth/auth.guard';
import { ApiKeyMiddleware } from '../shared/middleware/api-key.middleware';
import { SecurityHeadersMiddleware } from '../shared/middleware/security-headers.middleware';
import { RateLimitMiddleware } from '../shared/middleware/rate-limit.middleware';
import { InputValidationMiddleware } from '../shared/middleware/input-validation.middleware';

@Module({
  imports: [
    // Shared infrastructure
    SharedModule,

    // Throttler configuration for rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Default: 60 seconds
        limit: 10, // Default: 10 requests per minute (overridden by @Throttle decorators)
      },
    ]),

    // Main app modules
    MainAppModule,

    // Website builder modules - REMOVED
    // WebsiteBuilderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security headers to all routes
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    // Apply input validation to all routes except website-builder upload
    consumer
      .apply(InputValidationMiddleware)
      .exclude(
        { path: 'website-builder/upload', method: RequestMethod.POST },
      )
      .forRoutes('*');

    // Apply rate limiting to unified auth endpoints
    // Note: Throttle guards in the controller provide more granular rate limiting
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'auth/change-password', method: RequestMethod.POST },
      );

    // Apply API key middleware to all routes except status/health, auth, debug, and ai-receptionist
    consumer
      .apply(ApiKeyMiddleware)
      .exclude(
        { path: '', method: RequestMethod.GET },
        { path: 'status/health', method: RequestMethod.GET },
        { path: 'debug/redis/(.*)', method: RequestMethod.GET },
        { path: 'debug/redis/(.*)', method: RequestMethod.POST },
        { path: 'debug/redis/(.*)', method: RequestMethod.DELETE },
        { path: 'ai-receptionist/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
