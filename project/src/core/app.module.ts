import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StrategiesModule } from './strategies/strategies.module';
import { ClientsModule } from './clients/clients.module';
import { BookingsModule } from './bookings/bookings.module';
import { ChatModule } from './chat/chat.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { StatusModule } from './status/status.module';
import { BgProcessModule } from './bgprocess/bgprocess.module';
import { ApiKeyMiddleware } from './middleware/api-key.middleware';
import { ConfigModule } from './config/config.module';
import { GhlModule } from './integrations/ghl/ghl.module';
import { GeneralModule } from './general/general.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';

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
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
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
