import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { UnifiedAuthController } from '../../main-app/controllers/unified-auth.controller';
import { AdminManagementController } from '../../main-app/controllers/admin-management.controller';

// Services
import { UnifiedAuthService } from './services/unified-auth.service';
import { SecurityService } from './services/security.service';
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
    UnifiedAuthController,
    AdminManagementController,
  ],
  providers: [
    // Unified auth services
    UnifiedAuthService,
    SecurityService,

    // Shared services
    SystemUserService,
    AdminAuthCodeService,

    // Strategy & Guards
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [
    // Unified auth services
    UnifiedAuthService,
    SecurityService,

    // Shared services
    SystemUserService,
    AdminAuthCodeService,

    // Strategy & Guards
    JwtStrategy,
    JwtAuthGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}