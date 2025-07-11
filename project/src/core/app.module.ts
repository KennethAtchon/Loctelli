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
import { LeadsModule } from '../modules/leads/leads.module';
import { BookingsModule } from '../modules/bookings/bookings.module';
import { ChatModule } from '../modules/chat/chat.module';
import { PromptTemplatesModule } from '../modules/prompt-templates/prompt-templates.module';
import { IntegrationTemplatesModule } from '../integrations/modules/integration-templates/integration-templates.module';
import { IntegrationsModule } from '../integrations/modules/integrations/integrations.module';
import { SubAccountsModule } from '../modules/subaccounts/subaccounts.module';
import { WebhooksModule } from '../integrations/ghl-integrations/webhooks/webhooks.module';
import { StatusModule } from '../status/status.module';
import { BgProcessModule } from '../background/bgprocess/bgprocess.module';
import { ApiKeyMiddleware } from '../infrastructure/middleware/api-key.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GhlModule } from '../integrations/ghl-integrations/ghl/ghl.module';
import { GeneralModule } from '../general/general.module';
import { CommonModule } from '../infrastructure/cache/common.module';
import { AuthModule } from '../auth/auth.module';
import { SecurityHeadersMiddleware } from '../infrastructure/middleware/security-headers.middleware';
import { RateLimitMiddleware } from '../infrastructure/middleware/rate-limit.middleware';
import { InputValidationMiddleware } from '../infrastructure/middleware/input-validation.middleware';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DebugModule } from '../debug/debug.module';
import configuration from '../infrastructure/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    StrategiesModule,
    LeadsModule,
    BookingsModule,
    ChatModule,
    PromptTemplatesModule,
    IntegrationTemplatesModule,
    IntegrationsModule,
    SubAccountsModule,
    WebhooksModule,
    StatusModule,
    BgProcessModule,
    GhlModule,
    GeneralModule,
    DebugModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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

    // Apply API key middleware to all routes except status/health, auth, and debug
    consumer
      .apply(ApiKeyMiddleware)
      .exclude(
        { path: 'status/health', method: RequestMethod.GET },
        { path: 'debug/redis/*', method: RequestMethod.GET },
        { path: 'debug/redis/*', method: RequestMethod.POST },
        { path: 'debug/redis/*', method: RequestMethod.DELETE },
      )
      .forRoutes('*');
  }
}
