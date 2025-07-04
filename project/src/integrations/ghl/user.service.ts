import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GhlUser } from './types';

@Injectable()
export class GhlUserService {
  private readonly logger = new Logger(GhlUserService.name);
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
   * Get user details by user ID
   * API Docs: https://highlevel.stoplight.io/docs/integrations/a815845536249-get-user
   * @param userId The user ID
   * @returns The user details or null if not found
   */
  async getUser(userId: string): Promise<GhlUser | null> {
    try {
      const url = `${this.baseUrl}/users/${userId}`;
      
      const response = await axios.get(url, { 
        headers: this.getHeaders() 
      });
      
      if (response.status === 200) {
        return response.data;
      }
      
      this.logger.warn(`GHL Get User failed: ${response.status} ${response.statusText}`);
      return null;
    } catch (error) {
      this.logger.error(`Error calling GHL Get User: ${error}`);
      return null;
    }
  }

  /**
   * Search users in GoHighLevel
   * API Docs: https://highlevel.stoplight.io/docs/integrations/a815845536249-get-user
   * @param options Search options
   * @returns Array of users or empty array if none found
   */
  async searchUsers(options: {
    companyId: string;
    enabled2waySync?: boolean;
    ids?: string;
    limit?: number;
    locationId?: string;
    query?: string;
    role?: string;
    skip?: number;
    sort?: string;
    sortDirection?: string;
    type?: string;
  }): Promise<GhlUser[]> {
    try {
      const url = `${this.baseUrl}/users/search`;
      
      // Set default values
      const params = {
        companyId: options.companyId,
        enabled2waySync: options.enabled2waySync,
        ids: options.ids,
        limit: options.limit || 25,
        locationId: options.locationId,
        query: options.query,
        role: options.role,
        skip: options.skip || 0,
        sort: options.sort,
        sortDirection: options.sortDirection,
        type: options.type,
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        params
      });
      
      if (response.status === 200) {
        return response.data.users || [];
      }
      
      this.logger.warn(`GHL Search Users failed: ${response.status} ${response.statusText}`);
      return [];
    } catch (error) {
      this.logger.error(`Error calling GHL Search Users: ${error}`);
      return [];
    }
  }
}
