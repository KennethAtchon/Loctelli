import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../main-app/infrastructure/prisma/prisma.module';

// Security Services
import { PromptSecurityService } from './prompt-security.service';
import { SemanticSecurityService } from './semantic-security.service';
import { ValidationPipelineService } from './validation-pipeline.service';
import { SecureConversationService } from './secure-conversation.service';
import { SecurityMonitoringService } from './security-monitoring.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule
  ],
  providers: [
    // Core security services
    PromptSecurityService,
    SemanticSecurityService,
    ValidationPipelineService,
    SecureConversationService,
    SecurityMonitoringService,
  ],
  exports: [
    // Export all services for use in other modules
    PromptSecurityService,
    SemanticSecurityService,
    ValidationPipelineService,
    SecureConversationService,
    SecurityMonitoringService,
  ],
})
export class SecurityModule {}