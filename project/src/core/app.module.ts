import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { UsersModule } from '../modules/users/users.module';
import { StrategiesModule } from '../modules/strategies/strategies.module';
import { ClientsModule } from '../modules/clients/clients.module';
import { BookingsModule } from '../modules/bookings/bookings.module';
import { ChatModule } from '../modules/chat/chat.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { StatusModule } from '../status/status.module';
import { BgProcessModule } from '../background/bgprocess/bgprocess.module';
import { ApiKeyMiddleware } from '../infrastructure/middleware/api-key.middleware';
import { ConfigModule } from '../infrastructure/config/config.module';
import { GhlModule } from '../ghl/ghl.module';
import { GeneralModule } from '../general/general.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { SecurityHeadersMiddleware } from '../infrastructure/middleware/security-headers.middleware';
import { RateLimitMiddleware } from '../infrastructure/middleware/rate-limit.middleware';
import { InputValidationMiddleware } from '../infrastructure/middleware/input-validation.middleware';
import { JwtAuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    StrategiesModule,
    ClientsModule,
    BookingsModule,
    ChatModule,
    WebhooksModule,
    StatusModule,
    BgProcessModule,
    GhlModule,
    GeneralModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security headers to all routes
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    // Apply input validation to all routes
    consumer
      .apply(InputValidationMiddleware)
      .forRoutes('*');

    // Apply rate limiting to auth endpoints
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'admin/auth/login', method: RequestMethod.POST },
        { path: 'admin/auth/register', method: RequestMethod.POST },
      );

    // Apply API key middleware to all routes except status/health and auth
    consumer
      .apply(ApiKeyMiddleware)
      .exclude(
        { path: 'status/health', method: RequestMethod.GET },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'admin/auth/login', method: RequestMethod.POST },
        { path: 'admin/auth/register', method: RequestMethod.POST },
        { path: 'admin/auth/refresh', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
