import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from '../../main-app/controllers/auth.controller';
import { AdminAuthController } from '../../main-app/controllers/admin-auth.controller';

// Services
import { AuthService } from './services/auth.service';
import { AdminAuthService } from './services/admin-auth.service';
import { SystemUserService } from './services/system-user.service';
import { AdminAuthCodeService } from './services/admin-auth-code.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

// Guards
import { JwtAuthGuard } from './auth.guard';

// Shared modules
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m', // Default expiration, services can override
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    ConfigModule,
  ],
  controllers: [
    AuthController,
    AdminAuthController,
  ],
  providers: [
    AuthService,
    AdminAuthService,
    SystemUserService,
    AdminAuthCodeService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    AdminAuthService,
    SystemUserService,
    AdminAuthCodeService,
    JwtStrategy,
    JwtAuthGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}