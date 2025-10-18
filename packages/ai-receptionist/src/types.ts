/**
 * Core types for the Loctelli AI Receptionist SDK
 * AI Agent Orchestration Framework - Use your own API credentials
 */

// ============================================================================
// CORE CONFIGURATION
// ============================================================================

/**
 * Main SDK configuration - accepts user's own API credentials
 */
export interface AIReceptionistOptions {
  /** Twilio configuration (user's own account) */
  twilio?: TwilioConfig;

  /** Google APIs configuration (user's own account) */
  google?: GoogleConfig;

  /** Twitter/X API configuration (user's own account) */
  twitter?: TwitterConfig;

  /** AI Model configuration (user's choice of provider) */
  model: AIModelConfig;

  /** Agent behavior configuration */
  agent: AgentConfig;

  /** Notification settings */
  notifications?: NotificationConfig;

  /** Debug mode */
  debug?: boolean;
}

/**
 * Twilio configuration for phone/SMS
 */
export interface TwilioConfig {
  /** Twilio Account SID */
  accountSid: string;
  /** Twilio Auth Token */
  authToken: string;
  /** Your Twilio phone number */
  phoneNumber: string;
  /** Webhook URL for incoming calls/SMS (optional - SDK can auto-configure) */
  webhookUrl?: string;
}

/**
 * Google APIs configuration
 */
export interface GoogleConfig {
  /** Google Calendar configuration */
  calendar?: {
    /** OAuth2 Client ID */
    clientId: string;
    /** OAuth2 Client Secret */
    clientSecret: string;
    /** OAuth2 Refresh Token */
    refreshToken: string;
    /** Calendar ID (default: 'primary') */
    calendarId?: string;
  };

  /** Google Sheets configuration */
  sheets?: {
    /** Spreadsheet ID */
    spreadsheetId: string;
    /** Sheet name/tab */
    sheetName?: string;
    /** OAuth2 credentials */
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
}

/**
 * Twitter/X API configuration
 */
export interface TwitterConfig {
  /** Twitter API Key */
  apiKey: string;
  /** Twitter API Secret */
  apiSecret: string;
  /** Twitter Access Token */
  accessToken: string;
  /** Twitter Access Secret */
  accessSecret: string;
}

/**
 * AI Model configuration - supports multiple providers
 */
export interface AIModelConfig {
  /** AI provider */
  provider: 'openai' | 'anthropic' | 'gemini' | 'custom';
  /** API key for the provider */
  apiKey: string;
  /** Model name (e.g., 'gpt-4', 'claude-3-opus', 'gemini-pro') */
  model: string;
  /** Temperature (0-2, controls randomness) */
  temperature?: number;
  /** Max tokens per response */
  maxTokens?: number;
  /** Custom API endpoint (for custom providers) */
  endpoint?: string;
}

/**
 * Agent behavior configuration
 */
export interface AgentConfig {
  /** Agent name (e.g., "Sarah") */
  name: string;
  /** Agent role/description (e.g., "Sales Representative") */
  role: string;
  /** Personality description (e.g., "friendly and professional") */
  personality?: string;
  /** Custom instructions for the agent */
  instructions?: string;
  /** Which tools/integrations the agent can use */
  tools?: Array<'calendar' | 'sheets' | 'sms' | 'twitter' | 'email'>;
  /** Business information for answering questions */
  businessInfo?: {
    name: string;
    services: string[];
    hours: string;
    location?: string;
    pricing?: string;
  };
}

// ============================================================================
// COMMUNICATION CHANNELS
// ============================================================================

export type CommunicationChannel = 'phone' | 'video' | 'sms' | 'email';

export interface ChannelOptions {
  /** Lead ID from your CRM */
  leadId: string;
  /** Strategy ID (defines the agent approach) */
  strategyId: string;
  /** SubAccount ID for multi-tenancy */
  subAccountId?: string;
  /** Agent configuration */
  agentConfig: AgentConfig;
  /** Communication channel */
  channel: CommunicationChannel;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// PHONE & VIDEO CALLS
// ============================================================================

export interface CallOptions extends ChannelOptions {
  channel: 'phone' | 'video';
  /** Phone number to call (for outbound) or incoming number */
  phoneNumber?: string;
}

export interface CallSession {
  /** Unique call ID */
  id: string;
  /** Channel type */
  channel: 'phone' | 'video';
  /** WebRTC room name (for video) */
  roomName?: string;
  /** Join URL for video calls */
  joinUrl?: string;
  /** Access token for the room */
  token?: string;
  /** Phone number involved */
  phoneNumber?: string;
  /** Call status */
  status: 'pending' | 'ringing' | 'active' | 'ended' | 'missed';
  /** Call direction */
  direction: 'inbound' | 'outbound';
  /** Start time */
  startedAt?: Date;
  /** End time */
  endedAt?: Date;
}

export interface TranscriptEvent {
  /** Speaker role: 'lead' or 'agent' */
  speaker: 'lead' | 'agent';
  /** Transcribed text */
  text: string;
  /** Timestamp */
  timestamp: Date;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Is this a final transcript? */
  isFinal: boolean;
}

export interface CallSummary {
  /** Call ID */
  callId: string;
  /** Channel used */
  channel: 'phone' | 'video';
  /** Total duration in seconds */
  duration: number;
  /** Full transcript */
  transcript: string;
  /** AI-generated summary */
  summary: string;
  /** Lead qualification status */
  qualified?: boolean;
  /** Extracted contact information */
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  /** Extracted information */
  extractedInfo?: {
    serviceNeeded?: string;
    problemDescription?: string;
    budget?: string;
    timeline?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    nextSteps?: string;
  };
  /** Appointment information */
  appointment?: {
    scheduled: boolean;
    dateTime?: Date;
    duration?: number;
    calendarEventId?: string;
  };
  /** Recording URL */
  recordingUrl?: string;
  /** Call outcome */
  outcome?: 'booked' | 'follow_up' | 'disqualified' | 'no_answer' | 'cancelled' | 'rescheduled';
}

export type CallEvent =
  | { type: 'connected'; data: CallSession }
  | { type: 'transcript'; data: TranscriptEvent }
  | { type: 'ended'; data: CallSummary }
  | { type: 'error'; data: { message: string; code?: string } }
  | { type: 'agent_speaking'; data: { text: string } }
  | { type: 'lead_speaking'; data: { text: string } }
  | { type: 'appointment_booked'; data: AppointmentBookedEvent };

// ============================================================================
// SMS MESSAGING
// ============================================================================

export interface SMSOptions extends ChannelOptions {
  channel: 'sms';
  /** Phone number to send SMS to */
  phoneNumber: string;
  /** Initial message (for outbound SMS) */
  initialMessage?: string;
}

export interface SMSConversation {
  /** Unique conversation ID */
  id: string;
  /** Channel type */
  channel: 'sms';
  /** Phone number involved */
  phoneNumber: string;
  /** Conversation status */
  status: 'active' | 'ended' | 'waiting';
  /** Message history */
  messages: SMSMessage[];
  /** Started time */
  startedAt: Date;
  /** Last message time */
  lastMessageAt: Date;
}

export interface SMSMessage {
  /** Message ID */
  id: string;
  /** Direction */
  direction: 'inbound' | 'outbound';
  /** Sender */
  from: string;
  /** Recipient */
  to: string;
  /** Message content */
  body: string;
  /** Timestamp */
  timestamp: Date;
  /** Delivery status */
  status: 'queued' | 'sent' | 'delivered' | 'failed';
}

export interface SMSSummary {
  /** Conversation ID */
  conversationId: string;
  /** Channel used */
  channel: 'sms';
  /** Total messages */
  messageCount: number;
  /** Conversation transcript */
  transcript: string;
  /** AI-generated summary */
  summary: string;
  /** Lead qualification status */
  qualified?: boolean;
  /** Extracted contact information */
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  /** Extracted information */
  extractedInfo?: {
    serviceNeeded?: string;
    problemDescription?: string;
    budget?: string;
    timeline?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    nextSteps?: string;
  };
  /** Appointment information */
  appointment?: {
    scheduled: boolean;
    dateTime?: Date;
    duration?: number;
    calendarEventId?: string;
  };
  /** Outcome */
  outcome?: 'booked' | 'follow_up' | 'disqualified' | 'no_response';
}

export type SMSEvent =
  | { type: 'message_received'; data: SMSMessage }
  | { type: 'message_sent'; data: SMSMessage }
  | { type: 'conversation_ended'; data: SMSSummary }
  | { type: 'error'; data: { message: string; code?: string } }
  | { type: 'appointment_booked'; data: AppointmentBookedEvent };

// ============================================================================
// EMAIL MESSAGING
// ============================================================================

export interface EmailOptions extends ChannelOptions {
  channel: 'email';
  /** Email address to send to */
  emailAddress: string;
  /** Subject line (for outbound email) */
  subject?: string;
  /** Initial message (for outbound email) */
  initialMessage?: string;
}

export interface EmailConversation {
  /** Unique conversation ID */
  id: string;
  /** Channel type */
  channel: 'email';
  /** Email address involved */
  emailAddress: string;
  /** Email thread subject */
  subject: string;
  /** Conversation status */
  status: 'active' | 'ended' | 'waiting';
  /** Email messages */
  messages: EmailMessage[];
  /** Started time */
  startedAt: Date;
  /** Last message time */
  lastMessageAt: Date;
}

export interface EmailMessage {
  /** Message ID */
  id: string;
  /** Direction */
  direction: 'inbound' | 'outbound';
  /** Sender email */
  from: string;
  /** Recipient email */
  to: string;
  /** Subject */
  subject: string;
  /** Message body (HTML or plain text) */
  body: string;
  /** Body format */
  format: 'html' | 'text';
  /** Timestamp */
  timestamp: Date;
  /** Attachments */
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    url: string;
  }>;
}

export interface EmailSummary {
  /** Conversation ID */
  conversationId: string;
  /** Channel used */
  channel: 'email';
  /** Total messages */
  messageCount: number;
  /** Email thread transcript */
  transcript: string;
  /** AI-generated summary */
  summary: string;
  /** Lead qualification status */
  qualified?: boolean;
  /** Extracted contact information */
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  /** Extracted information */
  extractedInfo?: {
    serviceNeeded?: string;
    problemDescription?: string;
    budget?: string;
    timeline?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    nextSteps?: string;
  };
  /** Appointment information */
  appointment?: {
    scheduled: boolean;
    dateTime?: Date;
    duration?: number;
    calendarEventId?: string;
  };
  /** Outcome */
  outcome?: 'booked' | 'follow_up' | 'disqualified' | 'no_response';
}

export type EmailEvent =
  | { type: 'email_received'; data: EmailMessage }
  | { type: 'email_sent'; data: EmailMessage }
  | { type: 'conversation_ended'; data: EmailSummary }
  | { type: 'error'; data: { message: string; code?: string } }
  | { type: 'appointment_booked'; data: AppointmentBookedEvent };

// ============================================================================
// APPOINTMENTS & INTEGRATIONS
// ============================================================================

export interface AppointmentBookedEvent {
  /** Appointment ID */
  appointmentId: string;
  /** Lead information */
  lead: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  /** Appointment details */
  appointment: {
    dateTime: Date;
    duration: number;
    serviceType: string;
    notes?: string;
  };
  /** Google Calendar event ID */
  calendarEventId?: string;
  /** Spreadsheet row number */
  spreadsheetRow?: number;
}

export interface GoogleCalendarConfig {
  /** Calendar ID to book appointments */
  calendarId: string;
  /** OAuth credentials */
  credentials: {
    accessToken: string;
    refreshToken: string;
  };
  /** Default appointment duration (minutes) */
  defaultDuration?: number;
  /** Business hours */
  businessHours?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
}

export interface GoogleSheetsConfig {
  /** Spreadsheet ID */
  spreadsheetId: string;
  /** Sheet name/tab */
  sheetName?: string;
  /** OAuth credentials */
  credentials: {
    accessToken: string;
    refreshToken: string;
  };
  /** Column mapping */
  columnMapping?: {
    name?: string;
    phone?: string;
    email?: string;
    service?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    status?: string;
    notes?: string;
  };
}

export interface NotificationConfig {
  /** SMS notification settings */
  sms?: {
    enabled: boolean;
    phoneNumber: string; // Client's phone to notify
    provider: 'twilio' | 'messagebird';
    template?: string;
  };
  /** Email notification settings */
  email?: {
    enabled: boolean;
    emailAddress: string; // Client's email to notify
    provider: 'sendgrid' | 'mailgun' | 'ses';
    template?: string;
  };
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface ConversationAnalytics {
  /** Channel used */
  channel: CommunicationChannel;
  /** Response time metrics */
  responseTime: {
    average: number;
    median: number;
    p95: number;
  };
  /** Sentiment score (-1 to 1) */
  sentiment: number;
  /** Lead qualification score (0-100) */
  qualificationScore?: number;
  /** Key topics discussed */
  topics?: string[];
  /** Conversion metrics */
  conversion?: {
    qualified: boolean;
    booked: boolean;
    conversionRate: number;
  };
}

// ============================================================================
// API ERROR HANDLING
// ============================================================================

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

// ============================================================================
// UNIFIED EVENT TYPES
// ============================================================================

export type ReceptionistEvent = CallEvent | SMSEvent | EmailEvent;
