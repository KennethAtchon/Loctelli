/**
 * Main AI Receptionist SDK Client
 * Lightweight wrapper for convenient access to all resources
 */

import { CallsResource } from './resources/calls.resource';
import { SMSResource } from './resources/sms.resource';
import { EmailResource } from './resources/email.resource';
import { AIReceptionistConfig, validateBaseConfig } from './core';

/**
 * AIReceptionist - Universal AI Agent Orchestration Library
 *
 * This is a lightweight client that provides convenient access to all resources.
 * Resources automatically share underlying clients (Twilio, AI orchestrator) for optimal performance.
 *
 * For better tree-shaking, you can import and use resources directly.
 *
 * @example
 * ```typescript
 * // Option 1: Use the convenience client (automatically shares resources)
 * const client = new AIReceptionist({
 *   twilio: { accountSid: '...', authToken: '...', phoneNumber: '...' },
 *   model: { provider: 'openai', apiKey: '...', model: 'gpt-4' },
 *   agent: { name: 'Sarah', role: 'Sales Rep', personality: 'friendly and professional' }
 * });
 *
 * // Calls and SMS automatically share the same Twilio client and AI orchestrator
 * await client.calls.make({ to: '+1234567890' });
 * await client.sms.send({ to: '+1234567890', body: 'Hello!' });
 *
 * // Option 2: Import resources directly (better tree-shaking)
 * import { CallsResource } from '@loctelli/ai-receptionist';
 *
 * const calls = new CallsResource({
 *   twilio: { accountSid: '...', authToken: '...', phoneNumber: '...' },
 *   model: { provider: 'openai', apiKey: '...', model: 'gpt-4' },
 *   agent: { name: 'Sarah', role: 'Sales Rep' }
 * });
 *
 * await calls.make({ to: '+1234567890' });
 * ```
 */
export class AIReceptionist {
  public readonly calls?: CallsResource;
  public readonly sms?: SMSResource;
  public readonly email?: EmailResource;

  constructor(config: AIReceptionistConfig) {
    // Validate base configuration (model + agent required)
    validateBaseConfig(config);

    // Initialize resources based on what's configured
    // Resources automatically share underlying clients via ConfigurationManager
    if (config.twilio) {
      this.calls = new CallsResource({
        twilio: config.twilio,
        model: config.model,
        agent: config.agent,
        notifications: config.notifications,
        debug: config.debug,
      });

      this.sms = new SMSResource({
        twilio: config.twilio,
        model: config.model,
        agent: config.agent,
        notifications: config.notifications,
        debug: config.debug,
      });
    }

    if (config.email) {
      this.email = new EmailResource({
        email: config.email,
        model: config.model,
        agent: config.agent,
        notifications: config.notifications,
        debug: config.debug,
      });
    }

    if (config.debug) {
      console.log('[AIReceptionist] Initialized with resources:', {
        calls: !!this.calls,
        sms: !!this.sms,
        email: !!this.email,
      });
    }
  }
}
