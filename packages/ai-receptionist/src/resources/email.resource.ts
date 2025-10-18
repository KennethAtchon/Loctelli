/**
 * Email Resource
 * User-facing API for managing email conversations
 *
 * Supports two usage patterns:
 * 1. Standalone: new EmailResource({ email, model, agent })
 * 2. Via client: client.email.send(...)
 */

import { EmailResourceConfig, validateEmailResourceConfig } from '../core';

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: boolean;
}

export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt: Date;
}

/**
 * Email Resource - handles email messaging
 *
 * Can be used standalone for better tree-shaking:
 * @example
 * ```typescript
 * import { EmailResource } from '@loctelli/ai-receptionist';
 *
 * const email = new EmailResource({
 *   email: {
 *     provider: 'sendgrid',
 *     apiKey: '...',
 *     from: 'noreply@example.com'
 *   },
 *   model: { provider: 'openai', apiKey: '...', model: 'gpt-4' },
 *   agent: { name: 'Sarah', role: 'Sales Rep' }
 * });
 *
 * const message = await email.send({
 *   to: 'customer@example.com',
 *   subject: 'Thank you for contacting us',
 *   body: 'We will get back to you soon.'
 * });
 * ```
 *
 * Or via the main client:
 * @example
 * ```typescript
 * const client = new AIReceptionist({ ... });
 * const message = await client.email.send({ to: 'customer@example.com', ... });
 * ```
 */
export class EmailResource {
  private config: EmailResourceConfig;

  constructor(config: EmailResourceConfig) {
    // Validate configuration on construction
    validateEmailResourceConfig(config);
    this.config = config;
  }

  /**
   * Send an email
   *
   * @example
   * ```typescript
   * const message = await email.send({
   *   to: 'customer@example.com',
   *   subject: 'Thank you for contacting us',
   *   body: 'We will get back to you soon.',
   *   html: true
   * });
   * console.log('Email sent:', message.id);
   * ```
   */
  async send(options: SendEmailOptions): Promise<EmailMessage> {
    // TODO: Implement email sending via SendGrid/Mailgun/SES based on config.email.provider
    throw new Error('Email resource not yet implemented');
  }

  /**
   * Get email details
   *
   * @example
   * ```typescript
   * const emailDetails = await email.get('email-id-123');
   * console.log('Email status:', emailDetails.status);
   * ```
   */
  async get(emailId: string): Promise<EmailMessage> {
    // TODO: Fetch email details
    throw new Error('Not implemented');
  }

  /**
   * List recent emails
   *
   * @example
   * ```typescript
   * const recentEmails = await email.list({ limit: 10 });
   * console.log(`Found ${recentEmails.length} emails`);
   * ```
   */
  async list(options?: { limit?: number }): Promise<EmailMessage[]> {
    // TODO: List emails
    throw new Error('Not implemented');
  }
}
