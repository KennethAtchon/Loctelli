/**
 * Main AI Receptionist SDK Client
 * Lightweight wrapper for convenient access to all resources
 */

import { AIReceptionistOptions } from './types';
import { CallsResource } from './resources/calls.resource';
import { SMSResource } from './resources/sms.resource';
import { EmailResource } from './resources/email.resource';
import { CalendarResource } from './resources/calendar.resource';

/**
 * AIReceptionist - Universal AI Agent Orchestration Library
 *
 * This is a lightweight client that provides convenient access to all resources.
 * For better tree-shaking, you can import and use resources directly.
 *
 * @example
 * ```typescript
 * // Option 1: Use the client for convenient access to all resources
 * const client = new AIReceptionist({
 *   twilio: { accountSid: '...', authToken: '...', phoneNumber: '...' },
 *   google: { calendar: { ... } },
 *   model: { provider: 'openai', apiKey: '...', model: 'gpt-4' },
 *   agent: { name: 'Sarah', role: 'Sales Rep', ... }
 * });
 *
 * await client.calls.make({ to: '+1234567890' });
 * await client.sms.send({ to: '+1234567890', body: 'Hello!' });
 * await client.calendar.book({ ... });
 *
 * // Option 2: Import resources directly (better tree-shaking)
 * import { CallsResource } from '@loctelli/ai-receptionist';
 * const calls = new CallsResource({ twilio: { ... }, model: { ... }, agent: { ... } });
 * await calls.make({ to: '+1234567890' });
 * ```
 */
export class AIReceptionist {
  public readonly calls: CallsResource;
  public readonly sms: SMSResource;
  public readonly email: EmailResource;
  public readonly calendar: CalendarResource;

  constructor(options: AIReceptionistOptions) {
    // Initialize resources with config - they handle their own orchestrator setup
    this.calls = new CallsResource(options);
    this.sms = new SMSResource(options);
    this.email = new EmailResource(options);
    this.calendar = new CalendarResource(options);
  }
}
