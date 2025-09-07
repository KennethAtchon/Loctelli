import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { EncryptionService } from '../../../../shared/encryption/encryption.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService
  ) {}

  async findAll(subAccountId?: number) {
    this.logger.debug(`Finding integrations${subAccountId ? ` for subaccount ${subAccountId}` : ''}`);
    
    const where = subAccountId ? { subAccountId } : {};
    
    const integrations = await this.prisma.integration.findMany({
      where,
      include: {
        subAccount: {
          select: {
            id: true,
            name: true,
          },
        },
        integrationTemplate: {
          select: {
            id: true,
            name: true,
            displayName: true,
            category: true,
            icon: true,
          },
        },
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return integrations;
  }

  async findOne(id: number) {
    this.logger.debug(`Finding integration with id: ${id}`);
    const integration = await this.prisma.integration.findUnique({
      where: { id },
      include: {
        subAccount: {
          select: {
            id: true,
            name: true,
          },
        },
        integrationTemplate: {
          select: {
            id: true,
            name: true,
            displayName: true,
            category: true,
            icon: true,
            configSchema: true,
            setupInstructions: true,
          },
        },
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  async create(createDto: CreateIntegrationDto, adminId: number) {
    this.logger.debug(`Creating integration: ${createDto.name} with adminId: ${adminId}`);

    try {
      // Verify that the integration template exists
      const template = await this.prisma.integrationTemplate.findUnique({
        where: { id: createDto.integrationTemplateId },
      });

      if (!template) {
        throw new NotFoundException(`Integration template with ID ${createDto.integrationTemplateId} not found`);
      }

      // Verify that the subaccount exists
      const subAccount = await this.prisma.subAccount.findUnique({
        where: { id: createDto.subAccountId },
      });

      if (!subAccount) {
        throw new NotFoundException(`SubAccount with ID ${createDto.subAccountId} not found`);
      }

      // Encrypt sensitive config data before saving
      const encryptedConfig = this.encryptSensitiveConfig(createDto.config);

      const result = await this.prisma.integration.create({
        data: {
          ...createDto,
          config: encryptedConfig,
          createdByAdminId: adminId,
        },
        include: {
          subAccount: {
            select: {
              id: true,
              name: true,
            },
          },
          integrationTemplate: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
              icon: true,
            },
          },
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.debug(`Successfully created integration with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create integration: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateIntegrationDto) {
    this.logger.debug(`Updating integration with id: ${id}`);

    try {
      // Check if integration exists
      await this.findOne(id);

      // Encrypt sensitive config data if config is being updated
      const updateData = { ...updateDto };
      if (updateData.config) {
        updateData.config = this.encryptSensitiveConfig(updateData.config);
      }

      const result = await this.prisma.integration.update({
        where: { id },
        data: updateData,
        include: {
          subAccount: {
            select: {
              id: true,
              name: true,
            },
          },
          integrationTemplate: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
              icon: true,
            },
          },
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.debug(`Successfully updated integration with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update integration: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: number) {
    this.logger.debug(`Deleting integration with id: ${id}`);

    await this.findOne(id);

    return this.prisma.integration.delete({
      where: { id },
    });
  }

  async findBySubAccount(subAccountId: number) {
    this.logger.debug(`Finding integrations for subaccount: ${subAccountId}`);
    return this.findAll(subAccountId);
  }

  async findByStatus(status: string, subAccountId?: number) {
    this.logger.debug(`Finding integrations with status: ${status}`);
    
    const where: any = { status };
    if (subAccountId) {
      where.subAccountId = subAccountId;
    }

    return this.prisma.integration.findMany({
      where,
      include: {
        subAccount: {
          select: {
            id: true,
            name: true,
          },
        },
        integrationTemplate: {
          select: {
            id: true,
            name: true,
            displayName: true,
            category: true,
            icon: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(id: number, status: string, errorMessage?: string) {
    this.logger.debug(`Updating integration status: ${id} -> ${status}`);

    const updateData: any = { status };
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }
    if (status === 'active') {
      updateData.lastSyncAt = new Date();
    }

    return this.prisma.integration.update({
      where: { id },
      data: updateData,
    });
  }

  async testConnection(id: number) {
    this.logger.debug(`Testing connection for integration: ${id}`);
    
    const integration = await this.findOne(id);
    
    // TODO: Implement actual connection testing based on integration type
    // For now, just return a mock success response
    return {
      success: true,
      message: 'Connection test successful',
      integration: integration.integrationTemplate.displayName,
    };
  }

  async syncData(id: number) {
    this.logger.debug(`Syncing data for integration: ${id}`);
    
    const integration = await this.findOne(id);
    
    // TODO: Implement actual data synchronization based on integration type
    // For now, just update the last sync time
    await this.updateStatus(id, 'active');
    
    return {
      success: true,
      message: 'Data sync completed',
      integration: integration.integrationTemplate.displayName,
      lastSyncAt: new Date(),
    };
  }

  /**
   * Encrypt sensitive configuration data before storing in database
   * @param config Integration configuration object
   * @returns Configuration object with encrypted sensitive fields
   */
  private encryptSensitiveConfig(config: any): any {
    if (!config) return config;
    
    const encryptedConfig = { ...config };
    
    // Encrypt API key if present
    if (encryptedConfig.apiKey && typeof encryptedConfig.apiKey === 'string') {
      encryptedConfig.apiKey = this.encryptionService.safeEncrypt(encryptedConfig.apiKey);
    }
    
    // Add other sensitive fields here as needed
    // if (encryptedConfig.secretToken) {
    //   encryptedConfig.secretToken = this.encryptionService.safeEncrypt(encryptedConfig.secretToken);
    // }
    
    return encryptedConfig;
  }

  /**
   * Decrypt sensitive configuration data after retrieving from database
   * @param config Integration configuration object with encrypted fields
   * @returns Configuration object with decrypted sensitive fields
   */
  decryptSensitiveConfig(config: any): any {
    if (!config) return config;
    
    const decryptedConfig = { ...config };
    
    // Decrypt API key if present
    if (decryptedConfig.apiKey && typeof decryptedConfig.apiKey === 'string') {
      try {
        decryptedConfig.apiKey = this.encryptionService.safeDecrypt(decryptedConfig.apiKey);
      } catch (error) {
        this.logger.warn(`Failed to decrypt API key: ${error.message}`);
        // Keep the encrypted value if decryption fails
      }
    }
    
    // Add other sensitive fields here as needed
    // if (decryptedConfig.secretToken) {
    //   try {
    //     decryptedConfig.secretToken = this.encryptionService.safeDecrypt(decryptedConfig.secretToken);
    //   } catch (error) {
    //     this.logger.warn(`Failed to decrypt secret token: ${error.message}`);
    //   }
    // }
    
    return decryptedConfig;
  }
} 