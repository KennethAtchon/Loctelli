/**
 * Phone Resource
 * Main entry point for phone-related operations
 */

import { BaseResource } from './base';
import { CallsResource } from './phone/calls.resource';
import { NumbersResource } from './phone/numbers.resource';
import type { AIReceptionist } from '../client';

export class PhoneResource extends BaseResource {
  public readonly calls: CallsResource;
  public readonly numbers: NumbersResource;

  constructor(client: AIReceptionist) {
    super(client);

    // Initialize nested resources
    this.calls = new CallsResource(client);
    this.numbers = new NumbersResource(client);
  }

  /**
   * Quick method to make a call (delegates to calls.create)
   *
   * @example
   * const call = await client.phone.makeCall({
   *   channel: 'phone',
   *   phoneNumber: '+1234567890',
   *   leadId: 'lead_123',
   *   strategyId: 'strategy_456',
   *   agentConfig: { name: 'Sarah', role: 'Sales Rep' }
   * });
   */
  async makeCall(params: any) {
    return this.calls.create(params);
  }
}
