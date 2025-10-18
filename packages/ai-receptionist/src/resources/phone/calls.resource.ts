/**
 * Calls Resource
 * Handles phone call operations
 */

import { BaseResource } from '../base';
import { CallApiService } from './services';
import { Call } from './models';
import { CallOptions, CallSummary } from '../../types';
import type { AIReceptionist } from '../../client';

export class CallsResource extends BaseResource {
  private callApiService: CallApiService;

  constructor(client: AIReceptionist) {
    super(client);
    this.callApiService = new CallApiService(this.http);
  }

  /**
   * Initiate an outbound phone call
   *
   * @example
   * const call = await client.phone.calls.create({
   *   channel: 'phone',
   *   phoneNumber: '+1234567890',
   *   leadId: 'lead_123',
   *   strategyId: 'strategy_456',
   *   agentConfig: {
   *     name: 'Sarah',
   *     role: 'Sales Representative'
   *   }
   * });
   */
  async create(params: CallOptions): Promise<Call> {
    // Track analytics
    this.analyticsService.track('call_initiated', {
      phoneNumber: params.phoneNumber,
      leadId: params.leadId,
    });

    // Make API call
    const data = await this.callApiService.initiateCall(params);

    return new Call(data);
  }

  /**
   * Get call details by ID
   *
   * @example
   * const call = await client.phone.calls.retrieve('call_123');
   */
  async retrieve(callId: string): Promise<Call> {
    const data = await this.callApiService.getCall(callId);
    return new Call(data);
  }

  /**
   * List all calls with optional filters
   *
   * @example
   * const { calls, total } = await client.phone.calls.list({
   *   status: 'active',
   *   limit: 10
   * });
   */
  async list(filters?: {
    status?: string;
    leadId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ calls: Call[]; total: number }> {
    const result = await this.callApiService.listCalls(filters);

    return {
      calls: result.calls.map((data) => new Call(data)),
      total: result.total,
    };
  }

  /**
   * Hang up an active call
   *
   * @example
   * await client.phone.calls.hangup('call_123');
   */
  async hangup(callId: string): Promise<void> {
    await this.callApiService.hangup(callId);

    // Track analytics
    this.analyticsService.track('call_ended', { callId });
  }

  /**
   * Get call summary and transcript
   *
   * @example
   * const summary = await client.phone.calls.getSummary('call_123');
   */
  async getSummary(callId: string): Promise<CallSummary> {
    return this.callApiService.getCallSummary(callId);
  }

  /**
   * Get call recording URL
   *
   * @example
   * const { url } = await client.phone.calls.getRecording('call_123');
   */
  async getRecording(callId: string): Promise<{ url: string }> {
    return this.callApiService.getRecording(callId);
  }
}
