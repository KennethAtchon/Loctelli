/**
 * Calls Resource
 * User-facing API for managing phone calls
 *
 * Supports two usage patterns:
 * 1. Standalone: new CallsResource({ twilio, model, agent })
 * 2. Via client: client.calls.make(...)
 */

import { TwilioOrchestrator } from '../orchestrators/twilio.orchestrator';
import { CallsResourceConfig, validateCallsConfig, getConfigManager } from '../core';

export interface MakeCallOptions {
  to: string;
  metadata?: Record<string, any>;
}

export interface CallSession {
  id: string;
  to: string;
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  startedAt?: Date;
  endedAt?: Date;
}

/**
 * Calls Resource - handles phone call operations
 *
 * Can be used standalone for better tree-shaking:
 * @example
 * ```typescript
 * import { CallsResource } from '@loctelli/ai-receptionist';
 *
 * const calls = new CallsResource({
 *   twilio: { accountSid: '...', authToken: '...', phoneNumber: '...' },
 *   model: { provider: 'openai', apiKey: '...', model: 'gpt-4' },
 *   agent: { name: 'Sarah', role: 'Sales Rep' }
 * });
 *
 * const call = await calls.make({ to: '+1234567890' });
 * ```
 *
 * Or via the main client:
 * @example
 * ```typescript
 * const client = new AIReceptionist({ ... });
 * const call = await client.calls.make({ to: '+1234567890' });
 * ```
 */
export class CallsResource {
  private twilioOrchestrator?: TwilioOrchestrator;
  private config: CallsResourceConfig;
  private initialized = false;

  constructor(config: CallsResourceConfig) {
    // Validate configuration on construction
    validateCallsConfig(config);
    this.config = config;
  }

  /**
   * Lazy-load Twilio orchestrator via ConfigurationManager
   * This ensures shared resources are reused when multiple resources exist
   */
  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    const configManager = getConfigManager();

    // Get or create shared Twilio orchestrator
    this.twilioOrchestrator = configManager.getTwilioOrchestrator(
      this.config.twilio,
      this.config.model,
      this.config.agent
    );

    this.initialized = true;

    if (this.config.debug) {
      console.log('[CallsResource] Initialized with shared Twilio orchestrator');
      console.log('[ConfigManager] Cache stats:', configManager.getCacheStats());
    }
  }

  /**
   * Make an outbound call
   *
   * @example
   * ```typescript
   * const call = await calls.make({
   *   to: '+1234567890',
   *   metadata: { leadId: '123', campaign: 'summer-sale' }
   * });
   * console.log('Call initiated:', call.id);
   * ```
   */
  async make(options: MakeCallOptions): Promise<CallSession> {
    this.ensureInitialized();

    if (!this.twilioOrchestrator) {
      throw new Error(
        'Twilio orchestrator not initialized. This should never happen after validation.'
      );
    }

    const callSid = await this.twilioOrchestrator.makeOutboundCall(options.to, options.metadata);

    return {
      id: callSid,
      to: options.to,
      status: 'initiated',
      startedAt: new Date(),
    };
  }

  /**
   * Get call details
   *
   * @example
   * ```typescript
   * const callDetails = await calls.get('CA123...');
   * console.log('Call status:', callDetails.status);
   * ```
   */
  async get(callId: string): Promise<CallSession> {
    this.ensureInitialized();
    // TODO: Fetch call details from Twilio
    throw new Error('Not implemented');
  }

  /**
   * List recent calls
   *
   * @example
   * ```typescript
   * const recentCalls = await calls.list({ limit: 10 });
   * console.log(`Found ${recentCalls.length} calls`);
   * ```
   */
  async list(options?: { limit?: number }): Promise<CallSession[]> {
    this.ensureInitialized();
    // TODO: List calls from Twilio
    throw new Error('Not implemented');
  }

  /**
   * End an active call
   *
   * @example
   * ```typescript
   * await calls.end('CA123...');
   * console.log('Call ended');
   * ```
   */
  async end(callId: string): Promise<void> {
    this.ensureInitialized();
    // TODO: End call via Twilio
    throw new Error('Not implemented');
  }
}
