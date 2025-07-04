import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GhlLocation, GhlSubaccountsResponse } from './types';

@Injectable()
export class GhlSubaccountService {
  private readonly logger = new Logger(GhlSubaccountService.name);
  private readonly ghlApiKey: string;
  private readonly ghlApiVersion: string;
  private readonly baseUrl = 'https://services.leadconnectorhq.com';

  constructor(private configService: ConfigService) {
    this.ghlApiKey = this.configService.get<string>('GHL_API_KEY') || '';
    this.ghlApiVersion = this.configService.get<string>('GHL_API_VERSION', '2021-04-15');
  }

  /**
   * Get the headers for GoHighLevel API requests
   */
  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.ghlApiKey}`,
      'Version': this.ghlApiVersion,
    };
  }

  /**
   * Get all subaccounts (locations)
   * API Docs: https://highlevel.stoplight.io/docs/integrations/12f3fb56990d3-search
   * @returns Array of locations
   */
  async getSubaccounts(): Promise<GhlLocation[]> {
    try {
      const url = `${this.baseUrl}/locations/`;
      
      const response = await axios.get(url, { 
        headers: this.getHeaders() 
      });
      
      if (response.status === 200) {
        const data = response.data as GhlSubaccountsResponse;
        return data.locations || [];
      }
      
      return [];
    } catch (error) {
      this.logger.error(`Error fetching subaccounts: ${error}`);
      return [];
    }
  }

  /**
   * Get a specific subaccount (location) by ID
   * API Docs: https://highlevel.stoplight.io/docs/integrations/12f3fb56990d3-search
   * @param locationId The location ID
   * @returns The location or null if not found
   */
  async getSubaccount(locationId: string): Promise<GhlLocation | null> {
    try {
      const url = `${this.baseUrl}/locations/${locationId}`;
      
      const response = await axios.get(url, { 
        headers: this.getHeaders() 
      });
      
      if (response.status === 200) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error fetching subaccount locationId=${locationId}: ${error}`);
      return null;
    }
  }

  /**
   * Create a new subaccount (location)
   * API Docs: https://highlevel.stoplight.io/docs/integrations/12f3fb56990d3-search
   * @param location The location details
   * @returns The created location or null if failed
   */
  async createSubaccount(location: Partial<GhlLocation>): Promise<GhlLocation | null> {
    try {
      const url = `${this.baseUrl}/locations/`;
      
      const response = await axios.post(url, location, { 
        headers: this.getHeaders() 
      });
      
      if (response.status === 201 || response.status === 200) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error creating subaccount: ${error}`);
      return null;
    }
  }

  /**
   * Update a subaccount (location)
   * API Docs: https://highlevel.stoplight.io/docs/integrations/12f3fb56990d3-search
   * @param locationId The location ID
   * @param location The location details to update
   * @returns The updated location or null if failed
   */
  async updateSubaccount(locationId: string, location: Partial<GhlLocation>): Promise<GhlLocation | null> {
    try {
      const url = `${this.baseUrl}/locations/${locationId}`;
      
      const response = await axios.put(url, location, { 
        headers: this.getHeaders() 
      });
      
      if (response.status === 200) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error updating subaccount locationId=${locationId}: ${error}`);
      return null;
    }
  }
}
