import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import { CsvProcessorService } from './csv-processor.service';
import { CreateSmsCampaignDto, UpdateSmsCampaignDto } from './dto';
import { SmsCampaign, SmsMessage } from '@prisma/client';

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
}

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly csvProcessor: CsvProcessorService,
  ) {}

  /**
   * Create a new SMS campaign
   */
  async createCampaign(
    userId: number,
    subAccountId: number,
    createCampaignDto: CreateSmsCampaignDto,
  ): Promise<SmsCampaign> {
    try {
      // Validate recipients
      const validRecipients: string[] = [];
      const invalidRecipients: string[] = [];

      for (const recipient of createCampaignDto.recipients) {
        const validation = this.smsService.validatePhoneNumber(recipient);
        if (validation.isValid && validation.formattedNumber) {
          validRecipients.push(validation.formattedNumber);
        } else {
          invalidRecipients.push(recipient);
        }
      }

      if (validRecipients.length === 0) {
        throw new BadRequestException('No valid phone numbers provided');
      }

      if (invalidRecipients.length > 0) {
        this.logger.warn(`Campaign creation: ${invalidRecipients.length} invalid phone numbers ignored`);
      }

      // Remove duplicates
      const uniqueRecipients = [...new Set(validRecipients)];

      // Create campaign
      const campaign = await this.prisma.smsCampaign.create({
        data: {
          userId,
          subAccountId,
          name: createCampaignDto.name,
          message: createCampaignDto.message,
          totalRecipients: uniqueRecipients.length,
          scheduledAt: createCampaignDto.scheduledAt ? new Date(createCampaignDto.scheduledAt) : null,
          status: createCampaignDto.scheduledAt ? 'draft' : 'sending',
        },
      });

      // If not scheduled, start sending immediately
      if (!createCampaignDto.scheduledAt) {
        this.processCampaign(campaign.id, uniqueRecipients).catch(error => {
          this.logger.error(`Failed to process campaign ${campaign.id}:`, error);
        });
      }

      this.logger.log(`Campaign created: ${campaign.name} (ID: ${campaign.id}) with ${uniqueRecipients.length} recipients`);
      return campaign;

    } catch (error) {
      this.logger.error('Failed to create campaign:', error);
      throw error;
    }
  }

  /**
   * Process campaign and send messages
   */
  async processCampaign(campaignId: number, recipients: string[]): Promise<void> {
    try {
      const campaign = await this.prisma.smsCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      // Update campaign status
      await this.prisma.smsCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'sending',
          startedAt: new Date(),
        },
      });

      // Send messages in batches
      const messages = recipients.map(phoneNumber => ({
        phoneNumber,
        message: campaign.message,
      }));

      const result = await this.smsService.sendBulkSms(messages);

      // Save message records
      const messageRecords = result.results.map((smsResult, index) => ({
        userId: campaign.userId,
        subAccountId: campaign.subAccountId,
        campaignId: campaign.id,
        phoneNumber: recipients[index],
        message: campaign.message,
        status: smsResult.status || 'failed',
        twilioSid: smsResult.twilioSid,
        errorMessage: smsResult.error,
        sentAt: smsResult.success ? new Date() : null,
      }));

      await this.prisma.smsMessage.createMany({
        data: messageRecords,
      });

      // Update campaign statistics
      await this.prisma.smsCampaign.update({
        where: { id: campaignId },
        data: {
          sentCount: result.successful,
          failedCount: result.failed,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Campaign ${campaignId} completed. Sent: ${result.successful}, Failed: ${result.failed}`);

    } catch (error) {
      this.logger.error(`Failed to process campaign ${campaignId}:`, error);
      
      // Update campaign status to failed
      await this.prisma.smsCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'failed',
          completedAt: new Date(),
        },
      }).catch(() => {
        // Ignore update errors
      });

      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: number, userId: number, subAccountId: number): Promise<SmsCampaign> {
    const campaign = await this.prisma.smsCampaign.findFirst({
      where: {
        id: campaignId,
        userId,
        subAccountId,
      },
      include: {
        messages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Get campaigns for user
   */
  async getCampaigns(
    userId: number,
    subAccountId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    campaigns: SmsCampaign[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.smsCampaign.findMany({
        where: {
          userId,
          subAccountId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.smsCampaign.count({
        where: {
          userId,
          subAccountId,
        },
      }),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
    };
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: number,
    userId: number,
    subAccountId: number,
    updateCampaignDto: UpdateSmsCampaignDto,
  ): Promise<SmsCampaign> {
    const campaign = await this.prisma.smsCampaign.findFirst({
      where: {
        id: campaignId,
        userId,
        subAccountId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw new BadRequestException('Only draft campaigns can be updated');
    }

    return this.prisma.smsCampaign.update({
      where: { id: campaignId },
      data: {
        ...updateCampaignDto,
        scheduledAt: updateCampaignDto.scheduledAt ? new Date(updateCampaignDto.scheduledAt) : undefined,
      },
    });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: number, userId: number, subAccountId: number): Promise<void> {
    const campaign = await this.prisma.smsCampaign.findFirst({
      where: {
        id: campaignId,
        userId,
        subAccountId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status === 'sending') {
      throw new BadRequestException('Cannot delete campaign that is currently sending');
    }

    await this.prisma.smsCampaign.delete({
      where: { id: campaignId },
    });
  }

  /**
   * Get campaign messages
   */
  async getCampaignMessages(
    campaignId: number,
    userId: number,
    subAccountId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    messages: SmsMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Verify campaign ownership
    const campaign = await this.prisma.smsCampaign.findFirst({
      where: {
        id: campaignId,
        userId,
        subAccountId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.smsMessage.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.smsMessage.count({
        where: { campaignId },
      }),
    ]);

    return {
      messages,
      total,
      page,
      limit,
    };
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(userId: number, subAccountId: number): Promise<CampaignStats> {
    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      messageStats,
    ] = await Promise.all([
      this.prisma.smsCampaign.count({
        where: { userId, subAccountId },
      }),
      this.prisma.smsCampaign.count({
        where: { userId, subAccountId, status: 'sending' },
      }),
      this.prisma.smsCampaign.count({
        where: { userId, subAccountId, status: 'completed' },
      }),
      this.prisma.smsMessage.groupBy({
        by: ['status'],
        where: { userId, subAccountId },
        _count: { status: true },
      }),
    ]);

    const totalMessagesSent = messageStats.find(stat => stat.status === 'sent')?._count.status || 0;
    const totalMessagesDelivered = messageStats.find(stat => stat.status === 'delivered')?._count.status || 0;
    const totalMessagesFailed = messageStats.find(stat => stat.status === 'failed')?._count.status || 0;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalMessagesSent,
      totalMessagesDelivered,
      totalMessagesFailed,
    };
  }
}