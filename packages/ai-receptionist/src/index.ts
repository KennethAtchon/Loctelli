/**
 * @loctelli/ai-receptionist
 * AI-powered receptionist for phone calls, video calls, SMS, and email automation
 */

export { AIReceptionist } from './receptionist';
export { PhoneClient } from './clients/phone';
export { VideoClient } from './clients/video';
export { SMSClient } from './clients/sms';
export { EmailClient } from './clients/email';
export * from './types';

// Re-export common types for convenience
export type {
  AIReceptionistOptions,
  AgentConfig,
  CallOptions,
  CallSession,
  CallSummary,
  SMSOptions,
  SMSConversation,
  SMSSummary,
  EmailOptions,
  EmailConversation,
  EmailSummary,
  AppointmentBookedEvent,
  GoogleCalendarConfig,
  GoogleSheetsConfig,
  NotificationConfig,
  TranscriptEvent,
  CommunicationChannel,
} from './types';
