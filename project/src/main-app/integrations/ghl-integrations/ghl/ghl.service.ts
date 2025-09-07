import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { GhlSubaccountsResponse, GhlIntegrationConfigDto } from '../dto/ghl-integration-config.dto';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { EncryptionService } from '../../../../shared/encryption/encryption.service';

@Injectable()
export class GhlService {
  private readonly logger = new Logger(GhlService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Find integration by GHL locationId (used for webhook routing)
   * @param locationId GHL location ID from webhook
   * @returns Integration with subaccount and template info
   */
  async findIntegrationByLocationId(locationId: string) {
    return this.prisma.integration.findFirst({
      where: {
        config: {
          path: ['locationId'],
          equals: locationId
        }
      },
      include: {
        subAccount: true,
        integrationTemplate: true
      }
    });
  }

  /**
   * Make GHL API call with integration-specific credentials
   * @param integrationId Integration ID
   * @param endpoint API endpoint path
   * @param method HTTP method
   * @param data Request body
   * @returns API response
   */
  async makeGhlApiCall(integrationId: number, endpoint: string, method = 'GET', data?: any) {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId }
    });
    
    if (!integration) {
      throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
    }
    
    const config = integration.config as unknown as GhlIntegrationConfigDto;
    const baseUrl = config.baseUrl || 'https://rest.gohighlevel.com';
    const apiVersion = config.apiVersion || 'v1';
    
    // Decrypt the API key before using it
    const apiKey = this.encryptionService.safeDecrypt(config.apiKey);
    
    try {
      const response = await axios({
        method,
        url: `${baseUrl}/${apiVersion}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data
      });
      
      return response;
    } catch (error) {
      this.logger.error(`GHL API call failed for integration ${integrationId}: ${error.message}`);
      throw new HttpException(
        `GHL API call failed: ${error.response?.data?.message || error.message}`,
        error.response?.status || HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * Search for GoHighLevel subaccounts (locations) using specific integration
   * @param integrationId Integration ID for credentials
   * @returns List of subaccounts/locations from GoHighLevel API
   */
  async searchSubaccountsByIntegration(integrationId: number): Promise<GhlSubaccountsResponse> {
    try {
      this.logger.log(`Fetching subaccounts from GoHighLevel API for integration ${integrationId}`);
      
      const response = await this.makeGhlApiCall(integrationId, '/locations');
      return response.data as GhlSubaccountsResponse;
    } catch (error) {
      this.logger.error(`Error fetching subaccounts: ${error.message}`);
      throw error; // Re-throw as makeGhlApiCall already formats it properly
    }
  }

  /**
   * Test GHL API connection for an integration
   * @param integrationId Integration ID
   * @returns Connection test result
   */
  async testConnection(integrationId: number): Promise<{success: boolean, message: string, data?: any}> {
    try {
      const response = await this.makeGhlApiCall(integrationId, '/locations');
      return {
        success: true,
        message: 'Successfully connected to GoHighLevel',
        data: {
          locationsCount: response.data.locations?.length || 0,
          apiVersion: response.headers['x-api-version'] || 'v1'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.response?.data?.message || error.message}`
      };
    }
  }

  /**
   * Setup GHL webhook for an integration
   * @param integrationId Integration ID
   * @param webhookConfig Webhook configuration
   * @returns Webhook setup result
   */
  async setupWebhook(integrationId: number, webhookConfig: {events: string[]}) {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId }
    });
    
    if (!integration) {
      throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
    }
    
    const config = integration.config as unknown as GhlIntegrationConfigDto;
    const webhookUrl = config.webhookUrl || `${process.env.BACKEND_URL}/webhook`;
    
    try {
      // Register webhook with GHL API
      const response = await this.makeGhlApiCall(integrationId, '/webhooks', 'POST', {
        url: webhookUrl,
        events: webhookConfig.events
      });
      
      // Update integration with webhook ID - keep existing encryption
      const updatedConfig = {
        ...config,
        webhookId: response.data.id
      };
      
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: {
          config: updatedConfig
        }
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to setup webhook for integration ${integrationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility - searches for first active GHL integration
   * @deprecated Use searchSubaccounts(integrationId) instead
   * @returns List of subaccounts/locations from first available GHL integration
   */
  async searchSubaccounts(): Promise<GhlSubaccountsResponse> {
    // Find the first active GHL integration
    const integration = await this.prisma.integration.findFirst({
      where: {
        integrationTemplate: {
          name: 'gohighlevel'
        },
        status: 'active'
      }
    });

    if (!integration) {
      throw new HttpException(
        'No active GoHighLevel integration found. Please set up a GHL integration first.',
        HttpStatus.NOT_FOUND
      );
    }

    return this.searchSubaccountsByIntegration(integration.id);
  }
}
