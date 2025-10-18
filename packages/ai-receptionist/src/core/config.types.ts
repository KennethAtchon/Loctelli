/**
 * Configuration types for the AI Receptionist SDK
 * Supports both centralized and resource-specific configuration
 */

import {
  TwilioConfig,
  GoogleConfig,
  TwitterConfig,
  AIModelConfig,
  AgentConfig,
  NotificationConfig,
} from '../types';

// ============================================================================
// SHARED CONFIGURATIONS (used by multiple resources)
// ============================================================================

/**
 * Base configuration shared across multiple resources
 */
export interface BaseConfig {
  /** AI Model configuration (required for all resources) */
  model: AIModelConfig;
  /** Agent behavior configuration (required for all resources) */
  agent: AgentConfig;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Twilio-based resources configuration (Calls, SMS)
 */
export interface TwilioResourceConfig extends BaseConfig {
  /** Twilio configuration for phone/SMS */
  twilio: TwilioConfig;
  /** Notification settings */
  notifications?: NotificationConfig;
}

/**
 * Google-based resources configuration (Calendar)
 */
export interface GoogleResourceConfig extends BaseConfig {
  /** Google APIs configuration */
  google: GoogleConfig;
  /** Notification settings */
  notifications?: NotificationConfig;
}

/**
 * Email resource configuration
 */
export interface EmailResourceConfig extends BaseConfig {
  /** Email provider configuration */
  email?: {
    /** Email provider */
    provider: 'sendgrid' | 'mailgun' | 'ses';
    /** API key for the provider */
    apiKey: string;
    /** Sender email address */
    from: string;
    /** Reply-to email address */
    replyTo?: string;
  };
  /** Notification settings */
  notifications?: NotificationConfig;
}

// ============================================================================
// FULL SDK CONFIGURATION (for convenience client)
// ============================================================================

/**
 * Complete SDK configuration - accepts all possible options
 * Used by the main AIReceptionist client
 */
export interface AIReceptionistConfig extends BaseConfig {
  /** Twilio configuration (optional - required for calls/SMS) */
  twilio?: TwilioConfig;
  /** Google APIs configuration (optional - required for calendar) */
  google?: GoogleConfig;
  /** Twitter/X API configuration (optional - required for social) */
  twitter?: TwitterConfig;
  /** Email provider configuration (optional - required for email) */
  email?: {
    provider: 'sendgrid' | 'mailgun' | 'ses';
    apiKey: string;
    from: string;
    replyTo?: string;
  };
  /** Notification settings */
  notifications?: NotificationConfig;
}

// ============================================================================
// RESOURCE-SPECIFIC MINIMAL CONFIGS (for direct resource usage)
// ============================================================================

/**
 * Minimal configuration for CallsResource
 * Only includes what's needed for phone calls
 */
export type CallsResourceConfig = TwilioResourceConfig;

/**
 * Minimal configuration for SMSResource
 * Only includes what's needed for SMS messaging
 */
export type SMSResourceConfig = TwilioResourceConfig;

/**
 * Minimal configuration for CalendarResource
 * Only includes what's needed for calendar operations
 */
export type CalendarResourceConfig = GoogleResourceConfig;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if config has Twilio settings
 */
export function hasTwilioConfig(config: any): config is { twilio: TwilioConfig } {
  return config?.twilio !== undefined;
}

/**
 * Check if config has Google settings
 */
export function hasGoogleConfig(config: any): config is { google: GoogleConfig } {
  return config?.google !== undefined;
}

/**
 * Check if config has Email settings
 */
export function hasEmailConfig(
  config: any
): config is { email: EmailResourceConfig['email'] } {
  return config?.email !== undefined;
}

/**
 * Check if config has Model settings
 */
export function hasModelConfig(config: any): config is { model: AIModelConfig } {
  return config?.model !== undefined;
}

/**
 * Check if config has Agent settings
 */
export function hasAgentConfig(config: any): config is { agent: AgentConfig } {
  return config?.agent !== undefined;
}
