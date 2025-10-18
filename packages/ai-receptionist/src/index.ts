/**
 * @loctelli/ai-receptionist
 * AI-powered receptionist for phone calls, video calls, SMS, and email automation
 */

// Main client
export { AIReceptionist } from './client';

// Resources
export { PhoneResource, VideoResource, SMSResource, EmailResource } from './resources';

// Shared services (for advanced usage)
export type {
  AuthService,
  WebhookService,
  CalendarService,
  AnalyticsService,
} from './services';

// Errors
export * from './errors';

// Utils
export * from './utils';

// Types
export * from './types';
