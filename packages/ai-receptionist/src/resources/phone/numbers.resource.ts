/**
 * Numbers Resource
 * Handles phone number management
 */

import { BaseResource } from '../base';
import { NumberApiService, PhoneNumber } from './services';
import type { AIReceptionist } from '../../client';

export class NumbersResource extends BaseResource {
  private numberApiService: NumberApiService;

  constructor(client: AIReceptionist) {
    super(client);
    this.numberApiService = new NumberApiService(this.http);
  }

  /**
   * List all phone numbers
   *
   * @example
   * const numbers = await client.phone.numbers.list();
   */
  async list(): Promise<PhoneNumber[]> {
    return this.numberApiService.listNumbers();
  }

  /**
   * Get phone number details
   *
   * @example
   * const number = await client.phone.numbers.retrieve('number_123');
   */
  async retrieve(numberId: string): Promise<PhoneNumber> {
    return this.numberApiService.getNumber(numberId);
  }

  /**
   * Purchase a new phone number
   *
   * @example
   * const number = await client.phone.numbers.purchase({
   *   areaCode: '415',
   *   country: 'US',
   *   capabilities: ['voice', 'sms']
   * });
   */
  async purchase(params: {
    areaCode?: string;
    country?: string;
    capabilities?: string[];
  }): Promise<PhoneNumber> {
    const number = await this.numberApiService.purchaseNumber(params);

    // Track analytics
    this.analyticsService.track('phone_number_purchased', {
      numberId: number.id,
      number: number.number,
    });

    return number;
  }

  /**
   * Release a phone number
   *
   * @example
   * await client.phone.numbers.release('number_123');
   */
  async release(numberId: string): Promise<void> {
    await this.numberApiService.releaseNumber(numberId);

    // Track analytics
    this.analyticsService.track('phone_number_released', { numberId });
  }

  /**
   * Update phone number configuration
   *
   * @example
   * const number = await client.phone.numbers.update('number_123', {
   *   friendlyName: 'Main Office Line'
   * });
   */
  async update(
    numberId: string,
    updates: Partial<PhoneNumber>
  ): Promise<PhoneNumber> {
    return this.numberApiService.updateNumber(numberId, updates);
  }
}
