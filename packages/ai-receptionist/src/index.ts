/**
 * @loctelli/ai-receptionist
 * AI Agent Orchestration Framework
 *
 * Supports two usage patterns:
 * 1. Convenience client: new AIReceptionist({ ... })
 * 2. Direct resource imports: import { CallsResource } from '@loctelli/ai-receptionist'
 */

// Main client
export { AIReceptionist } from './client';

// Resources (user-facing API - can be imported directly for tree-shaking)
export {
  CallsResource,
  SMSResource,
  EmailResource,
} from './resources';

export type {
  MakeCallOptions,
  CallSession,
  SendSMSOptions,
  SMSMessage,
  SendEmailOptions,
  EmailMessage,
} from './resources';

// Configuration types (for TypeScript users)
export type {
  AIReceptionistConfig,
  CallsResourceConfig,
  SMSResourceConfig,
  EmailResourceConfig,
  GoogleResourceConfig,
  TwilioResourceConfig,
  BaseConfig,
} from './core';

// Configuration validation (for advanced usage)
export {
  validateCallsConfig,
  validateSMSConfig,
  validateEmailResourceConfig,
  validateBaseConfig,
  ConfigValidationError,
} from './core';

// Orchestrators (for advanced usage - internal layer)
export { TwilioOrchestrator } from './orchestrators/twilio.orchestrator';
export { GoogleOrchestrator } from './orchestrators/google.orchestrator';
export { TwitterOrchestrator } from './orchestrators/twitter.orchestrator';
export { AIOrchestrator } from './orchestrators/ai.orchestrator';
export { ConversationManager } from './orchestrators/conversation.manager';

// Utility services (for advanced usage)
export { AnalyticsService, WebhookService } from './services';
export type { AnalyticsEvent, WebhookConfig } from './services';

// Legacy types (from types.ts - for backward compatibility)
export * from './types';

// Errors
export * from './errors';
