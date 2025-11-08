import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../shared/auth/auth.module';
import { OnboardingGuard } from '../shared/guards/onboarding.guard';
import { UsersModule } from './modules/users/users.module';
import { StrategiesModule } from './modules/strategies/strategies.module';
import { LeadsModule } from './modules/leads/leads.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ChatModule } from './modules/chat/chat.module';
import { PromptTemplatesModule } from './modules/prompt-templates/prompt-templates.module';
import { IntegrationTemplatesModule } from './integrations/modules/integration-templates/integration-templates.module';
import { IntegrationsModule } from './integrations/modules/integrations/integrations.module';
import { SubAccountsModule } from './modules/subaccounts/subaccounts.module';
import { WebhooksModule } from './integrations/ghl-integrations/webhooks/webhooks.module';
import { StatusModule } from './status/status.module';
import { BgProcessModule } from './background/bgprocess/bgprocess.module';
import { GhlModule } from './integrations/ghl-integrations/ghl/ghl.module';
import { GeneralModule } from './general/general.module';
import { DebugModule } from './debug/debug.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { FormsModule } from './modules/forms/forms.module';
import { AIReceptionistModule } from './modules/ai-receptionist/ai-receptionist.module';

@Module({
  imports: [
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
    ContactsModule,
    FormsModule,
    AIReceptionistModule,
  ],
  providers: [
    // Apply OnboardingGuard globally
    {
      provide: APP_GUARD,
      useClass: OnboardingGuard,
    },
  ],
})
export class MainAppModule {} 