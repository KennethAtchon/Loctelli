/**
 * Phone Number API Service
 * Handles HTTP requests for phone number management
 */

import { HttpClient } from '../../../utils/http';

export interface PhoneNumber {
  id: string;
  number: string;
  friendlyName?: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
  status: 'active' | 'inactive';
}

export class NumberApiService {
  constructor(private http: HttpClient) {}

  /**
   * List all phone numbers
   */
  async listNumbers(): Promise<PhoneNumber[]> {
    return this.http.get('/phone/numbers');
  }

  /**
   * Get phone number details
   */
  async getNumber(numberId: string): Promise<PhoneNumber> {
    return this.http.get(`/phone/numbers/${numberId}`);
  }

  /**
   * Purchase a new phone number
   */
  async purchaseNumber(params: {
    areaCode?: string;
    country?: string;
    capabilities?: string[];
  }): Promise<PhoneNumber> {
    return this.http.post('/phone/numbers/purchase', params);
  }

  /**
   * Release a phone number
   */
  async releaseNumber(numberId: string): Promise<void> {
    return this.http.delete(`/phone/numbers/${numberId}`);
  }

  /**
   * Update phone number configuration
   */
  async updateNumber(
    numberId: string,
    updates: Partial<PhoneNumber>
  ): Promise<PhoneNumber> {
    return this.http.patch(`/phone/numbers/${numberId}`, updates);
  }
}
