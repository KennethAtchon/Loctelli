/**
 * @loctelli/ai-receptionist
 * AI Agent Orchestration Framework
 */

// Main client
export { AIReceptionist } from './client';

// Resources (user-facing API)
export {
  CallsResource,
  SMSResource,
  EmailResource,
  CalendarResource,
} from './resources';

export type {
  MakeCallOptions,
  CallSession,
  SendSMSOptions,
  SMSMessage,
  SendEmailOptions,
  EmailMessage,
  BookAppointmentOptions,
  Appointment,
} from './resources';

// Orchestrators (for advanced usage - internal layer)
export { TwilioOrchestrator } from './orchestrators/twilio.orchestrator';
export { GoogleOrchestrator } from './orchestrators/google.orchestrator';
export { TwitterOrchestrator } from './orchestrators/twitter.orchestrator';
export { AIOrchestrator } from './orchestrators/ai.orchestrator';
export { ConversationManager } from './orchestrators/conversation.manager';

// Utility services (for advanced usage)
export { AnalyticsService, WebhookService, AuthService } from './services';
export type { AnalyticsEvent, WebhookConfig } from './services';

// Types
export * from './types';

// Errors
export * from './errors';
