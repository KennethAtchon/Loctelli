/**
 * SMS Resource
 * User-facing API for managing SMS conversations
 *
 * Supports two usage patterns:
 * 1. Standalone: new SMSResource({ twilio, model, agent })
 * 2. Via client: client.sms.send(...)
 */

import { TwilioOrchestrator } from '../orchestrators/twilio.orchestrator';
import { SMSResourceConfig, validateSMSConfig, getConfigManager } from '../core';

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
 *
 * Can be used standalone for better tree-shaking:
 * @example
 * ```typescript
 * import { SMSResource } from '@loctelli/ai-receptionist';
 *
 * const sms = new SMSResource({
 *   twilio: { accountSid: '...', authToken: '...', phoneNumber: '...' },
 *   model: { provider: 'openai', apiKey: '...', model: 'gpt-4' },
 *   agent: { name: 'Sarah', role: 'Sales Rep' }
 * });
 *
 * const message = await sms.send({
 *   to: '+1234567890',
 *   body: 'Hello from AI Receptionist!'
 * });
 * ```
 *
 * Or via the main client:
 * @example
 * ```typescript
 * const client = new AIReceptionist({ ... });
 * const message = await client.sms.send({ to: '+1234567890', body: 'Hello!' });
 * ```
 */
export class SMSResource {
  private twilioOrchestrator?: TwilioOrchestrator;
  private config: SMSResourceConfig;
  private initialized = false;

  constructor(config: SMSResourceConfig) {
    // Validate configuration on construction
    validateSMSConfig(config);
    this.config = config;
  }

  /**
   * Lazy-load Twilio orchestrator via ConfigurationManager
   * This ensures shared resources are reused with CallsResource
   */
  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    const configManager = getConfigManager();

    // Get or create shared Twilio orchestrator (reused with CallsResource)
    this.twilioOrchestrator = configManager.getTwilioOrchestrator(
      this.config.twilio,
      this.config.model,
      this.config.agent
    );

    this.initialized = true;

    if (this.config.debug) {
      console.log('[SMSResource] Initialized with shared Twilio orchestrator');
      console.log('[ConfigManager] Cache stats:', configManager.getCacheStats());
    }
  }

  /**
   * Send an SMS message
   *
   * @example
   * ```typescript
   * const message = await sms.send({
   *   to: '+1234567890',
   *   body: 'Hello from AI Receptionist!'
   * });
   * console.log('Message sent:', message.id);
   * ```
   */
  async send(options: SendSMSOptions): Promise<SMSMessage> {
    this.ensureInitialized();

    if (!this.twilioOrchestrator) {
      throw new Error(
        'Twilio orchestrator not initialized. This should never happen after validation.'
      );
    }

    const messageSid = await this.twilioOrchestrator.sendSMS({
      to: options.to,
      body: options.body,
    });

    return {
      id: messageSid,
      to: options.to,
      from: this.config.twilio.phoneNumber,
      body: options.body,
      status: 'queued',
      sentAt: new Date(),
    };
  }

  /**
   * Get SMS message details
   *
   * @example
   * ```typescript
   * const messageDetails = await sms.get('SM123...');
   * console.log('Message status:', messageDetails.status);
   * ```
   */
  async get(messageId: string): Promise<SMSMessage> {
    this.ensureInitialized();
    // TODO: Fetch message from Twilio
    throw new Error('Not implemented');
  }

  /**
   * List recent SMS messages
   *
   * @example
   * ```typescript
   * const recentMessages = await sms.list({ limit: 10 });
   * console.log(`Found ${recentMessages.length} messages`);
   * ```
   */
  async list(options?: { limit?: number }): Promise<SMSMessage[]> {
    this.ensureInitialized();
    // TODO: List messages from Twilio
    throw new Error('Not implemented');
  }
}
