/**
 * Calls Resource
 * User-facing API for managing phone calls
 */

import { AIReceptionistOptions } from '../types';
import { TwilioOrchestrator } from '../orchestrators/twilio.orchestrator';
import { ConversationManager } from '../orchestrators/conversation.manager';
import { AIOrchestrator } from '../orchestrators/ai.orchestrator';

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
 * Can be used standalone or via AIReceptionist client
 */
export class CallsResource {
  private twilioOrchestrator?: TwilioOrchestrator;
  private conversationManager?: ConversationManager;
  private options: AIReceptionistOptions;

  constructor(options: AIReceptionistOptions) {
    this.options = options;
  }

  /**
   * Lazy-load Twilio orchestrator and conversation manager
   */
  private ensureInitialized() {
    if (!this.twilioOrchestrator && this.options.twilio) {
      const aiOrchestrator = new AIOrchestrator(this.options.model, this.options.agent);
      this.conversationManager = new ConversationManager(aiOrchestrator);
      this.twilioOrchestrator = new TwilioOrchestrator(
        this.options.twilio,
        this.conversationManager
      );
    }
  }

  /**
   * Make an outbound call
   *
   * @example
   * const call = await client.calls.make({
   *   to: '+1234567890'
   * });
   */
  async make(options: MakeCallOptions): Promise<CallSession> {
    this.ensureInitialized();

    if (!this.twilioOrchestrator) {
      throw new Error('Twilio not configured. Please provide Twilio credentials in options.');
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
   */
  async get(callId: string): Promise<CallSession> {
    // TODO: Fetch call details from Twilio
    throw new Error('Not implemented');
  }

  /**
   * List recent calls
   */
  async list(options?: { limit?: number }): Promise<CallSession[]> {
    // TODO: List calls from Twilio
    throw new Error('Not implemented');
  }

  /**
   * End an active call
   */
  async end(callId: string): Promise<void> {
    // TODO: End call via Twilio
    throw new Error('Not implemented');
  }
}
