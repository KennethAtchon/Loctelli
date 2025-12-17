import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HighLevel } from '@gohighlevel/api-client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { EncryptionService } from '../../../../shared/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';
import { GhlIntegrationConfigDto } from '../dto/ghl-integration-config.dto';

@Injectable()
export class GhlApiClientService {
  private readonly logger = new Logger(GhlApiClientService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a GoHighLevel API client instance for a specific integration
   * @param integrationId Integration ID to get credentials from
   * @returns Configured HighLevel API client
   */
  private async createGhlClient(integrationId: number): Promise<HighLevel> {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
    }

    const config = integration.config as unknown as GhlIntegrationConfigDto;

    // Decrypt the API key and other credentials
    const apiKey = this.encryptionService.safeDecrypt(config.apiKey);
    const clientId = config.clientId
      ? this.encryptionService.safeDecrypt(config.clientId)
      : undefined;
    const clientSecret = config.clientSecret
      ? this.encryptionService.safeDecrypt(config.clientSecret)
      : undefined;

    if (!apiKey) {
      throw new HttpException(
        'API key not found or could not be decrypted',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create client configuration
    const clientConfig: any = {};

    // For OAuth apps, use clientId and clientSecret
    if (clientId && clientSecret) {
      clientConfig.clientId = clientId;
      clientConfig.clientSecret = clientSecret;
      clientConfig.locationAccessToken = apiKey; // In OAuth, this would be the access token
    } else {
      // For private integration token
      clientConfig.privateIntegrationToken = apiKey;
    }

    // Set API version if specified
    if (config.apiVersion) {
      clientConfig.apiVersion = config.apiVersion;
    }

    return new HighLevel(clientConfig);
  }

  /**
   * Search locations (subaccounts) for an integration
   * @param integrationId Integration ID
   * @param searchParams Search parameters
   * @returns List of locations
   */
  async searchLocations(
    integrationId: number,
    searchParams: {
      companyId?: string;
      skip?: string;
      limit?: string;
      order?: string;
      email?: string;
    } = {},
  ) {
    try {
      this.logger.log(
        `Searching locations from GoHighLevel API for integration ${integrationId}`,
      );

      const client = await this.createGhlClient(integrationId);
      const response = await client.locations.searchLocations(searchParams);

      this.logger.log(
        `Successfully fetched ${response.locations?.length || 0} locations`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error searching locations for integration ${integrationId}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to search locations: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get a specific location by ID
   * @param integrationId Integration ID
   * @param locationId Location ID
   * @returns Location details
   */
  async getLocation(integrationId: number, locationId: string) {
    try {
      this.logger.log(
        `Fetching location ${locationId} for integration ${integrationId}`,
      );

      const client = await this.createGhlClient(integrationId);
      const response = await client.locations.getLocation({ locationId });

      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching location ${locationId}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to fetch location: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get calendars for a specific location
   * @param integrationId Integration ID
   * @param locationId Location ID
   * @param options Optional parameters
   * @returns List of calendars
   */
  async getCalendars(
    integrationId: number,
    locationId: string,
    options: {
      groupId?: string;
      showDrafted?: boolean;
    } = {},
  ) {
    try {
      this.logger.log(`Fetching calendars for location ${locationId}`);

      const client = await this.createGhlClient(integrationId);
      const response = await client.calendars.getCalendars({
        locationId,
        ...options,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching calendars for location ${locationId}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to fetch calendars: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Create a block slot in calendar
   * @param integrationId Integration ID
   * @param blockSlotData Block slot data
   * @returns Created block slot
   */
  async createBlockSlot(
    integrationId: number,
    blockSlotData: {
      calendarId: string;
      locationId: string;
      startTime: string;
      endTime: string;
      title: string;
    },
  ) {
    try {
      this.logger.log(
        `Creating block slot for calendar ${blockSlotData.calendarId}`,
      );

      const client = await this.createGhlClient(integrationId);
      const response = await client.calendars.createBlockSlot(blockSlotData);

      return response;
    } catch (error) {
      this.logger.error(`Error creating block slot: ${error.message}`);
      throw new HttpException(
        `Failed to create block slot: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Create an appointment
   * @param integrationId Integration ID
   * @param appointmentData Appointment data
   * @returns Created appointment
   */
  async createAppointment(
    integrationId: number,
    appointmentData: {
      calendarId: string;
      locationId: string;
      contactId: string;
      startTime: string;
      endTime: string;
      title: string;
      description?: string;
    },
  ) {
    try {
      this.logger.log(
        `Creating appointment for calendar ${appointmentData.calendarId}`,
      );

      const client = await this.createGhlClient(integrationId);
      const response =
        await client.calendars.createAppointment(appointmentData);

      return response;
    } catch (error) {
      this.logger.error(`Error creating appointment: ${error.message}`);
      throw new HttpException(
        `Failed to create appointment: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Search opportunities for a location
   * @param integrationId Integration ID
   * @param searchParams Search parameters
   * @returns List of opportunities
   */
  async searchOpportunities(
    integrationId: number,
    searchParams: {
      locationId: string;
      q?: string;
      pipelineId?: string;
      pipelineStageId?: string;
      contactId?: string;
      status?: string;
      assignedTo?: string;
      campaignId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    try {
      this.logger.log(
        `Searching opportunities for location ${searchParams.locationId}`,
      );

      const client = await this.createGhlClient(integrationId);
      const response =
        await client.opportunities.searchOpportunity(searchParams);

      return response;
    } catch (error) {
      this.logger.error(`Error searching opportunities: ${error.message}`);
      throw new HttpException(
        `Failed to search opportunities: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get a specific opportunity
   * @param integrationId Integration ID
   * @param opportunityId Opportunity ID
   * @returns Opportunity details
   */
  async getOpportunity(integrationId: number, opportunityId: string) {
    try {
      this.logger.log(`Fetching opportunity ${opportunityId}`);

      const client = await this.createGhlClient(integrationId);
      const response = await client.opportunities.getOpportunity({
        id: opportunityId,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching opportunity ${opportunityId}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to fetch opportunity: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Create an opportunity
   * @param integrationId Integration ID
   * @param opportunityData Opportunity data
   * @returns Created opportunity
   */
  async createOpportunity(
    integrationId: number,
    opportunityData: {
      locationId: string;
      pipelineId: string;
      pipelineStageId: string;
      name: string;
      status: string;
      monetaryValue?: number;
      contactId: string;
    },
  ) {
    try {
      this.logger.log(
        `Creating opportunity for location ${opportunityData.locationId}`,
      );

      const client = await this.createGhlClient(integrationId);
      const response =
        await client.opportunities.createOpportunity(opportunityData);

      return response;
    } catch (error) {
      this.logger.error(`Error creating opportunity: ${error.message}`);
      throw new HttpException(
        `Failed to create opportunity: ${error.message}`,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Test the API connection for an integration
   * @param integrationId Integration ID
   * @returns Connection test result
   */
  async testConnection(
    integrationId: number,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const client = await this.createGhlClient(integrationId);

      // Try to search locations with minimal parameters
      const response = await client.locations.searchLocations({
        limit: '1',
      });

      return {
        success: true,
        message: 'Successfully connected to GoHighLevel',
        data: {
          locationsCount: response.locations?.length || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Find integration by GHL locationId (used for webhook routing)
   * @param locationId GHL location ID from webhook
   * @returns Integration with subaccount and template info
   */
  findIntegrationByLocationId(locationId: string) {
    return this.prisma.integration.findFirst({
      where: {
        config: {
          path: ['locationId'],
          equals: locationId,
        },
      },
      include: {
        subAccount: true,
        integrationTemplate: true,
      },
    });
  }

  /**
   * Legacy compatibility method - searches for first active GHL integration
   * @deprecated Use searchLocations(integrationId) instead
   * @returns List of locations from first available GHL integration
   */
  async searchSubaccounts() {
    // Find the first active GHL integration
    const integration = await this.prisma.integration.findFirst({
      where: {
        integrationTemplate: {
          name: 'gohighlevel',
        },
        status: 'active',
      },
    });

    if (!integration) {
      throw new HttpException(
        'No active GoHighLevel integration found. Please set up a GHL integration first.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.searchLocations(integration.id);
  }
}
