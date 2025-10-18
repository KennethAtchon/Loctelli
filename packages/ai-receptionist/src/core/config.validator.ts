/**
 * Configuration validation utilities
 * Progressive validation - only validates what each resource needs
 */

import {
  TwilioConfig,
  GoogleConfig,
  AIModelConfig,
  AgentConfig,
} from '../types';
import {
  AIReceptionistConfig,
  TwilioResourceConfig,
  GoogleResourceConfig,
  EmailResourceConfig,
  hasTwilioConfig,
  hasGoogleConfig,
  hasEmailConfig,
  hasModelConfig,
  hasAgentConfig,
} from './config.types';

/**
 * Validation error class
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly resource?: string
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate Twilio configuration
 */
export function validateTwilioConfig(config: TwilioConfig, resource?: string): void {
  if (!config.accountSid || typeof config.accountSid !== 'string') {
    throw new ConfigValidationError(
      'Twilio accountSid is required and must be a string',
      'twilio.accountSid',
      resource
    );
  }

  if (!config.authToken || typeof config.authToken !== 'string') {
    throw new ConfigValidationError(
      'Twilio authToken is required and must be a string',
      'twilio.authToken',
      resource
    );
  }

  if (!config.phoneNumber || typeof config.phoneNumber !== 'string') {
    throw new ConfigValidationError(
      'Twilio phoneNumber is required and must be a string',
      'twilio.phoneNumber',
      resource
    );
  }

  // Validate phone number format (basic E.164 check)
  if (!config.phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
    throw new ConfigValidationError(
      'Twilio phoneNumber must be in E.164 format (e.g., +1234567890)',
      'twilio.phoneNumber',
      resource
    );
  }
}

/**
 * Validate Google configuration
 */
export function validateGoogleConfig(config: GoogleConfig, resource?: string): void {
  // At least one Google service must be configured
  if (!config.calendar && !config.sheets) {
    throw new ConfigValidationError(
      'Google configuration must include at least calendar or sheets',
      'google',
      resource
    );
  }

  // Validate calendar config if present
  if (config.calendar) {
    if (!config.calendar.clientId || typeof config.calendar.clientId !== 'string') {
      throw new ConfigValidationError(
        'Google Calendar clientId is required and must be a string',
        'google.calendar.clientId',
        resource
      );
    }

    if (!config.calendar.clientSecret || typeof config.calendar.clientSecret !== 'string') {
      throw new ConfigValidationError(
        'Google Calendar clientSecret is required and must be a string',
        'google.calendar.clientSecret',
        resource
      );
    }

    if (!config.calendar.refreshToken || typeof config.calendar.refreshToken !== 'string') {
      throw new ConfigValidationError(
        'Google Calendar refreshToken is required and must be a string',
        'google.calendar.refreshToken',
        resource
      );
    }
  }

  // Validate sheets config if present
  if (config.sheets) {
    if (!config.sheets.spreadsheetId || typeof config.sheets.spreadsheetId !== 'string') {
      throw new ConfigValidationError(
        'Google Sheets spreadsheetId is required and must be a string',
        'google.sheets.spreadsheetId',
        resource
      );
    }

    if (!config.sheets.clientId || typeof config.sheets.clientId !== 'string') {
      throw new ConfigValidationError(
        'Google Sheets clientId is required and must be a string',
        'google.sheets.clientId',
        resource
      );
    }

    if (!config.sheets.clientSecret || typeof config.sheets.clientSecret !== 'string') {
      throw new ConfigValidationError(
        'Google Sheets clientSecret is required and must be a string',
        'google.sheets.clientSecret',
        resource
      );
    }

    if (!config.sheets.refreshToken || typeof config.sheets.refreshToken !== 'string') {
      throw new ConfigValidationError(
        'Google Sheets refreshToken is required and must be a string',
        'google.sheets.refreshToken',
        resource
      );
    }
  }
}

/**
 * Validate AI Model configuration
 */
export function validateModelConfig(config: AIModelConfig, resource?: string): void {
  const validProviders = ['openai', 'anthropic', 'gemini', 'custom'];
  if (!validProviders.includes(config.provider)) {
    throw new ConfigValidationError(
      `AI provider must be one of: ${validProviders.join(', ')}`,
      'model.provider',
      resource
    );
  }

  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new ConfigValidationError(
      'AI model apiKey is required and must be a string',
      'model.apiKey',
      resource
    );
  }

  if (!config.model || typeof config.model !== 'string') {
    throw new ConfigValidationError(
      'AI model name is required and must be a string',
      'model.model',
      resource
    );
  }

  // Validate optional parameters
  if (config.temperature !== undefined) {
    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
      throw new ConfigValidationError(
        'AI model temperature must be a number between 0 and 2',
        'model.temperature',
        resource
      );
    }
  }

  if (config.maxTokens !== undefined) {
    if (typeof config.maxTokens !== 'number' || config.maxTokens <= 0) {
      throw new ConfigValidationError(
        'AI model maxTokens must be a positive number',
        'model.maxTokens',
        resource
      );
    }
  }

  // Validate custom endpoint if custom provider
  if (config.provider === 'custom' && !config.endpoint) {
    throw new ConfigValidationError(
      'AI model endpoint is required when using custom provider',
      'model.endpoint',
      resource
    );
  }
}

/**
 * Validate Agent configuration
 */
export function validateAgentConfig(config: AgentConfig, resource?: string): void {
  if (!config.name || typeof config.name !== 'string') {
    throw new ConfigValidationError(
      'Agent name is required and must be a string',
      'agent.name',
      resource
    );
  }

  if (!config.role || typeof config.role !== 'string') {
    throw new ConfigValidationError(
      'Agent role is required and must be a string',
      'agent.role',
      resource
    );
  }

  // Validate tools if specified
  if (config.tools) {
    const validTools = ['calendar', 'sheets', 'sms', 'twitter', 'email'];
    const invalidTools = config.tools.filter(tool => !validTools.includes(tool));
    if (invalidTools.length > 0) {
      throw new ConfigValidationError(
        `Invalid agent tools: ${invalidTools.join(', ')}. Valid tools: ${validTools.join(', ')}`,
        'agent.tools',
        resource
      );
    }
  }
}

/**
 * Validate Email configuration
 */
export function validateEmailConfig(
  config: NonNullable<EmailResourceConfig['email']>,
  resource?: string
): void {
  const validProviders = ['sendgrid', 'mailgun', 'ses'];
  if (!validProviders.includes(config.provider)) {
    throw new ConfigValidationError(
      `Email provider must be one of: ${validProviders.join(', ')}`,
      'email.provider',
      resource
    );
  }

  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new ConfigValidationError(
      'Email apiKey is required and must be a string',
      'email.apiKey',
      resource
    );
  }

  if (!config.from || typeof config.from !== 'string') {
    throw new ConfigValidationError(
      'Email from address is required and must be a string',
      'email.from',
      resource
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.from)) {
    throw new ConfigValidationError(
      'Email from address must be a valid email',
      'email.from',
      resource
    );
  }

  if (config.replyTo && !emailRegex.test(config.replyTo)) {
    throw new ConfigValidationError(
      'Email replyTo address must be a valid email',
      'email.replyTo',
      resource
    );
  }
}

// ============================================================================
// RESOURCE-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Validate configuration for CallsResource
 */
export function validateCallsConfig(config: TwilioResourceConfig): void {
  if (!hasTwilioConfig(config)) {
    throw new ConfigValidationError(
      'CallsResource requires Twilio configuration',
      'twilio',
      'CallsResource'
    );
  }

  if (!hasModelConfig(config)) {
    throw new ConfigValidationError(
      'CallsResource requires AI model configuration',
      'model',
      'CallsResource'
    );
  }

  if (!hasAgentConfig(config)) {
    throw new ConfigValidationError(
      'CallsResource requires agent configuration',
      'agent',
      'CallsResource'
    );
  }

  validateTwilioConfig(config.twilio, 'CallsResource');
  validateModelConfig(config.model, 'CallsResource');
  validateAgentConfig(config.agent, 'CallsResource');
}

/**
 * Validate configuration for SMSResource
 */
export function validateSMSConfig(config: TwilioResourceConfig): void {
  if (!hasTwilioConfig(config)) {
    throw new ConfigValidationError(
      'SMSResource requires Twilio configuration',
      'twilio',
      'SMSResource'
    );
  }

  if (!hasModelConfig(config)) {
    throw new ConfigValidationError(
      'SMSResource requires AI model configuration',
      'model',
      'SMSResource'
    );
  }

  if (!hasAgentConfig(config)) {
    throw new ConfigValidationError(
      'SMSResource requires agent configuration',
      'agent',
      'SMSResource'
    );
  }

  validateTwilioConfig(config.twilio, 'SMSResource');
  validateModelConfig(config.model, 'SMSResource');
  validateAgentConfig(config.agent, 'SMSResource');
}

/**
 * Validate configuration for EmailResource
 */
export function validateEmailResourceConfig(config: EmailResourceConfig): void {
  if (!hasEmailConfig(config)) {
    throw new ConfigValidationError(
      'EmailResource requires email provider configuration',
      'email',
      'EmailResource'
    );
  }

  if (!hasModelConfig(config)) {
    throw new ConfigValidationError(
      'EmailResource requires AI model configuration',
      'model',
      'EmailResource'
    );
  }

  if (!hasAgentConfig(config)) {
    throw new ConfigValidationError(
      'EmailResource requires agent configuration',
      'agent',
      'EmailResource'
    );
  }

  validateEmailConfig(config.email!, 'EmailResource');
  validateModelConfig(config.model, 'EmailResource');
  validateAgentConfig(config.agent, 'EmailResource');
}

/**
 * Validate configuration for CalendarResource
 */
export function validateCalendarConfig(config: GoogleResourceConfig): void {
  if (!hasGoogleConfig(config)) {
    throw new ConfigValidationError(
      'CalendarResource requires Google configuration',
      'google',
      'CalendarResource'
    );
  }

  if (!hasModelConfig(config)) {
    throw new ConfigValidationError(
      'CalendarResource requires AI model configuration',
      'model',
      'CalendarResource'
    );
  }

  if (!hasAgentConfig(config)) {
    throw new ConfigValidationError(
      'CalendarResource requires agent configuration',
      'agent',
      'CalendarResource'
    );
  }

  validateGoogleConfig(config.google, 'CalendarResource');
  validateModelConfig(config.model, 'CalendarResource');
  validateAgentConfig(config.agent, 'CalendarResource');
}

/**
 * Validate base configuration (model + agent only)
 * Used by the main AIReceptionist client
 */
export function validateBaseConfig(config: AIReceptionistConfig): void {
  if (!hasModelConfig(config)) {
    throw new ConfigValidationError(
      'AIReceptionist requires AI model configuration',
      'model',
      'AIReceptionist'
    );
  }

  if (!hasAgentConfig(config)) {
    throw new ConfigValidationError(
      'AIReceptionist requires agent configuration',
      'agent',
      'AIReceptionist'
    );
  }

  validateModelConfig(config.model, 'AIReceptionist');
  validateAgentConfig(config.agent, 'AIReceptionist');

  // Validate optional configs if provided
  if (hasTwilioConfig(config)) {
    validateTwilioConfig(config.twilio, 'AIReceptionist');
  }

  if (hasGoogleConfig(config)) {
    validateGoogleConfig(config.google, 'AIReceptionist');
  }

  if (hasEmailConfig(config)) {
    validateEmailConfig(config.email!, 'AIReceptionist');
  }
}
