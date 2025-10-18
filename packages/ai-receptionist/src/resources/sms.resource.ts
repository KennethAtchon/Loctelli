/**
 * SMS Resource
 * User-facing API for managing SMS conversations
 */

import { TwilioOrchestrator } from '../orchestrators/twilio.orchestrator';
import { ConversationManager } from '../orchestrators/conversation.manager';

export interface SendSMSOptions {
  to: string;
  body: string;
}

export interface SMSMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt: Date;
}

/**
 * SMS Resource - handles SMS messaging
 */
export class SMSResource {
  constructor(
    private twilioOrchestrator?: TwilioOrchestrator,
    private conversationManager?: ConversationManager
  ) {}

  /**
   * Send an SMS message
   *
   * @example
   * const message = await client.sms.send({
   *   to: '+1234567890',
   *   body: 'Hello from AI Receptionist!'
   * });
   */
  async send(options: SendSMSOptions): Promise<SMSMessage> {
    if (!this.twilioOrchestrator) {
      throw new Error('Twilio not configured. Please provide Twilio credentials in AIReceptionist options.');
    }

    // TODO: Use TwilioOrchestrator to send SMS
    const messageSid = await this.twilioOrchestrator.sendSMS({
      to: options.to,
      body: options.body,
    });

    return {
      id: messageSid,
      to: options.to,
      from: '', // TODO: Get from Twilio config
      body: options.body,
      status: 'queued',
      sentAt: new Date(),
    };
  }

  /**
   * Get SMS message details
   */
  async get(messageId: string): Promise<SMSMessage> {
    // TODO: Fetch message from Twilio
    throw new Error('Not implemented');
  }

  /**
   * List recent SMS messages
   */
  async list(options?: { limit?: number }): Promise<SMSMessage[]> {
    // TODO: List messages from Twilio
    throw new Error('Not implemented');
  }
}
