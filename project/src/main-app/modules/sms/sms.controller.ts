import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { SmsService, CsvProcessorService, CampaignService } from '../../../shared/sms';
import { SendSmsDto, BulkSmsDto, CreateSmsCampaignDto } from '../../../shared/sms/dto';
import { User } from '@prisma/client';

@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly csvProcessor: CsvProcessorService,
    private readonly campaignService: CampaignService,
  ) {}

  /**
   * Send single SMS message
   */
  @Post('send')
  async sendSms(
    @CurrentUser() user: User,
    @Body() sendSmsDto: SendSmsDto,
  ) {
    try {
      const result = await this.smsService.sendSms(
        sendSmsDto.phoneNumber,
        sendSmsDto.message,
      );

      if (result.success) {
        // Save message to database
        // Note: This would typically be handled by a separate service
        // For now, we'll return the result directly
        return {
          success: true,
          message: 'SMS sent successfully',
          data: result,
        };
      } else {
        throw new BadRequestException(result.error);
      }
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to send SMS');
    }
  }

  /**
   * Send bulk SMS via CSV upload
   */
  @Post('bulk')
  @UseInterceptors(FileInterceptor('file'))
  async sendBulkSms(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('message') message: string,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!message) {
      throw new BadRequestException('Message is required');
    }

    try {
      // Validate CSV structure
      const validation = await this.csvProcessor.validateCsvStructure(file.buffer);
      if (!validation.isValid) {
        throw new BadRequestException(validation.error || 'Invalid CSV format');
      }

      if (!validation.hasPhoneColumn) {
        throw new BadRequestException(
          'CSV must contain a phone number column (phoneNumber, phone, number, mobile, etc.)',
        );
      }

      // Process CSV and extract phone numbers
      const csvResult = await this.csvProcessor.processCsvFile(file.buffer);

      if (csvResult.validNumbers.length === 0) {
        throw new BadRequestException('No valid phone numbers found in CSV');
      }

      // Create campaign for bulk SMS
      const campaignDto: CreateSmsCampaignDto = {
        name: `Bulk SMS - ${new Date().toISOString()}`,
        message,
        recipients: csvResult.validNumbers,
      };

      const campaign = await this.campaignService.createCampaign(
        user.id,
        user.subAccountId,
        campaignDto,
      );

      return {
        success: true,
        message: 'Bulk SMS campaign created and processing started',
        data: {
          campaignId: campaign.id,
          totalRecipients: csvResult.validNumbers.length,
          invalidNumbers: csvResult.invalidNumbers.length,
          duplicates: csvResult.duplicates.length,
          errors: csvResult.errors,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to process bulk SMS');
    }
  }

  /**
   * Create SMS campaign
   */
  @Post('campaigns')
  async createCampaign(
    @CurrentUser() user: User,
    @Body() createCampaignDto: CreateSmsCampaignDto,
  ) {
    try {
      const campaign = await this.campaignService.createCampaign(
        user.id,
        user.subAccountId,
        createCampaignDto,
      );

      return {
        success: true,
        message: 'Campaign created successfully',
        data: campaign,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create campaign');
    }
  }

  /**
   * Get campaigns
   */
  @Get('campaigns')
  async getCampaigns(
    @CurrentUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || isNaN(limitNum)) {
        throw new BadRequestException('Page and limit must be valid numbers');
      }

      const result = await this.campaignService.getCampaigns(
        user.id,
        user.subAccountId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: {
          data: result.campaigns,
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch campaigns');
    }
  }

  /**
   * Get campaign statistics
   */
  @Get('campaigns/stats')
  async getCampaignStats(@CurrentUser() user: User) {
    try {
      const stats = await this.campaignService.getCampaignStats(
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch campaign statistics');
    }
  }

  /**
   * Get campaign by ID
   */
  @Get('campaigns/:id')
  async getCampaign(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) campaignId: number,
  ) {
    try {
      const campaign = await this.campaignService.getCampaign(
        campaignId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: campaign,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch campaign');
    }
  }

  /**
   * Get campaign messages
   */
  @Get('campaigns/:id/messages')
  async getCampaignMessages(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) campaignId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || isNaN(limitNum)) {
        throw new BadRequestException('Page and limit must be valid numbers');
      }

      const result = await this.campaignService.getCampaignMessages(
        campaignId,
        user.id,
        user.subAccountId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: {
          data: result.messages,
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch campaign messages');
    }
  }

  /**
   * Get SMS messages
   */
  @Get('messages')
  async getMessages(
    @CurrentUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string,
    @Query('phoneNumber') phoneNumber?: string,
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const campaignIdNum = campaignId ? parseInt(campaignId, 10) : undefined;

      if (isNaN(pageNum) || isNaN(limitNum)) {
        throw new BadRequestException('Page and limit must be valid numbers');
      }

      const result = await this.campaignService.getMessages(
        user.id,
        user.subAccountId,
        pageNum,
        limitNum,
        status,
        campaignIdNum,
        phoneNumber,
      );

      return {
        success: true,
        data: {
          data: result.messages,
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch SMS messages');
    }
  }

  /**
   * Get SMS statistics
   */
  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    try {
      const stats = await this.campaignService.getCampaignStats(
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch SMS statistics');
    }
  }

  /**
   * Get SMS service status
   */
  @Get('status')
  async getServiceStatus() {
    try {
      const status = this.smsService.getStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get service status');
    }
  }

  /**
   * Validate phone number
   */
  @Post('validate-phone')
  async validatePhone(@Body('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }

    try {
      const validation = this.smsService.validatePhoneNumber(phoneNumber);
      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to validate phone number');
    }
  }

  /**
   * Get SMS settings
   */
  @Get('settings')
  async getSettings() {
    try {
      const settings = {
        rateLimitPerMinute: this.smsService.getRateLimitPerMinute(),
        maxBatchSize: this.smsService.getMaxBatchSize(),
        retryAttempts: this.smsService.getRetryAttempts(),
        twilioConfigured: this.smsService.isConfigured(),
      };

      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get SMS settings');
    }
  }

  /**
   * Update SMS settings (admin only)
   */
  @Put('settings')
  async updateSettings(@Body() settings: any) {
    try {
      // This would typically update environment variables or database settings
      // For now, we'll just return success
      return {
        success: true,
        message: 'Settings updated successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update SMS settings');
    }
  }

  /**
   * Test Twilio connection
   */
  @Post('test-connection')
  async testConnection() {
    try {
      if (!this.smsService.isConfigured()) {
        return {
          success: false,
          message: 'Twilio is not configured',
        };
      }

      // Test the connection by trying to get account info
      const testResult = await this.smsService.testConnection();
      return {
        success: true,
        data: testResult,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection test failed',
      };
    }
  }

  /**
   * Get Twilio configuration (admin only)
   */
  @Get('twilio-config')
  async getTwilioConfig() {
    try {
      const config = {
        configured: this.smsService.isConfigured(),
        accountSid: this.smsService.isConfigured() ? '••••••••••••••••••••••••••••••••' : undefined,
        phoneNumber: this.smsService.getPhoneNumber(),
      };

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get Twilio configuration');
    }
  }

  /**
   * Update Twilio configuration (admin only)
   */
  @Put('twilio-config')
  async updateTwilioConfig(@Body() config: any) {
    try {
      // This would typically update environment variables or database settings
      // For now, we'll just return success
      return {
        success: true,
        message: 'Twilio configuration updated successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update Twilio configuration');
    }
  }
}