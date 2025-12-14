import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../main-app/infrastructure/prisma/prisma.module';

// Security Services
import { SecureConversationService } from './secure-conversation.service';
import { SecurityMonitoringService } from './security-monitoring.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    // Core security services
    SecureConversationService,
    SecurityMonitoringService,
  ],
  exports: [
    // Export all services for use in other modules
    SecureConversationService,
    SecurityMonitoringService,
  ],
})
export class SecurityModule {}
