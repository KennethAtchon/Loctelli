/**
 * Email Resource
 * User-facing API for managing email conversations
 */

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
 * Note: Requires email provider configuration (SendGrid, etc.)
 */
export class EmailResource {
  constructor() {
    // TODO: Accept email orchestrator when implemented
  }

  /**
   * Send an email
   *
   * @example
   * const email = await client.email.send({
   *   to: 'customer@example.com',
   *   subject: 'Thank you for contacting us',
   *   body: 'We will get back to you soon.'
   * });
   */
  async send(options: SendEmailOptions): Promise<EmailMessage> {
    // TODO: Implement email sending via SendGrid/Mailgun/etc.
    throw new Error('Email resource not yet implemented');
  }

  /**
   * Get email details
   */
  async get(emailId: string): Promise<EmailMessage> {
    // TODO: Fetch email details
    throw new Error('Not implemented');
  }

  /**
   * List recent emails
   */
  async list(options?: { limit?: number }): Promise<EmailMessage[]> {
    // TODO: List emails
    throw new Error('Not implemented');
  }
}
