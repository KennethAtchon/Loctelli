import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import {
  SmsServiceInterface,
  SmsMessage,
  SmsResult,
  BulkSmsResult,
  PhoneValidationResult,
  SmsConfig,
} from './interfaces';

@Injectable()
export class SmsService implements SmsServiceInterface {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: Twilio;
  private readonly smsConfig: SmsConfig;
  private readonly rateLimitPerMinute: number;
  private readonly maxBatchSize: number;
  private readonly retryAttempts: number;

  constructor(private readonly configService: ConfigService) {
    this.smsConfig = this.configService.get<SmsConfig>('twilio') || {} as SmsConfig;
    this.rateLimitPerMinute = this.configService.get<number>('sms.rateLimitPerMinute') || 60;
    this.maxBatchSize = this.configService.get<number>('sms.maxBatchSize') || 100;
    this.retryAttempts = this.configService.get<number>('sms.retryAttempts') || 3;

    if (!this.smsConfig?.accountSid || !this.smsConfig?.authToken) {
      this.logger.warn('Twilio credentials not configured. SMS functionality will be disabled.');
      return;
    }

    this.twilioClient = new Twilio(this.smsConfig.accountSid, this.smsConfig.authToken);
    this.logger.log('SMS Service initialized with Twilio');
  }

  /**
   * Send a single SMS message
   */
  async sendSms(phoneNumber: string, message: string): Promise<SmsResult> {
    try {
      // Validate phone number
      const phoneValidation = this.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return {
          success: false,
          error: phoneValidation.error || 'Invalid phone number',
          status: 'failed',
        };
      }

      // Format message
      const formattedMessage = this.formatMessage(message);

      // Send SMS via Twilio
      const twilioMessage = await this.twilioClient.messages.create({
        body: formattedMessage,
        from: this.smsConfig.phoneNumber,
        to: phoneValidation.formattedNumber!,
      });

      this.logger.log(`SMS sent successfully to ${phoneValidation.formattedNumber}. SID: ${twilioMessage.sid}`);

      return {
        success: true,
        messageId: twilioMessage.sid,
        twilioSid: twilioMessage.sid,
        status: 'sent',
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
        status: 'failed',
      };
    }
  }

  /**
   * Send bulk SMS messages with rate limiting
   */
  async sendBulkSms(messages: SmsMessage[]): Promise<BulkSmsResult> {
    const results: SmsResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    // Process messages in batches to respect rate limits
    const batches = this.createBatches(messages, this.maxBatchSize);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (msg) => {
        const result = await this.sendSmsWithRetry(msg.phoneNumber, msg.message);
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`${msg.phoneNumber}: ${result.error}`);
        }
        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(60000 / this.rateLimitPerMinute * batch.length);
      }
    }

    return {
      totalProcessed: messages.length,
      successful,
      failed,
      results,
      errors,
    };
  }

  /**
   * Send SMS with retry logic
   */
  private async sendSmsWithRetry(phoneNumber: string, message: string): Promise<SmsResult> {
    let lastError: string = 'Failed after all retry attempts';

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      const result = await this.sendSms(phoneNumber, message);
      
      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';
      
      if (attempt < this.retryAttempts) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await this.delay(delay);
        this.logger.warn(`Retrying SMS to ${phoneNumber} (attempt ${attempt + 1}/${this.retryAttempts})`);
      }
    }

    return {
      success: false,
      error: lastError,
      status: 'failed',
    };
  }

  /**
   * Validate and format phone number
   */
  validatePhoneNumber(phoneNumber: string): PhoneValidationResult {
    try {
      // Remove any whitespace and special characters except + and digits
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

      if (!isValidPhoneNumber(cleanNumber)) {
        return {
          isValid: false,
          error: 'Invalid phone number format',
        };
      }

      const parsedNumber = parsePhoneNumber(cleanNumber);
      
      return {
        isValid: true,
        formattedNumber: parsedNumber.format('E.164'),
        country: parsedNumber.country,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Unable to parse phone number',
      };
    }
  }

  /**
   * Format message content
   */
  formatMessage(message: string): string {
    // Trim whitespace and ensure proper encoding
    return message.trim();
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return !!(this.smsConfig?.accountSid && this.smsConfig?.authToken && this.smsConfig?.phoneNumber);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      rateLimitPerMinute: this.rateLimitPerMinute,
      maxBatchSize: this.maxBatchSize,
      retryAttempts: this.retryAttempts,
    };
  }

  /**
   * Get rate limit per minute
   */
  getRateLimitPerMinute(): number {
    return this.rateLimitPerMinute;
  }

  /**
   * Get max batch size
   */
  getMaxBatchSize(): number {
    return this.maxBatchSize;
  }

  /**
   * Get retry attempts
   */
  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  /**
   * Get phone number
   */
  getPhoneNumber(): string | undefined {
    return this.smsConfig?.phoneNumber;
  }

  /**
   * Test Twilio connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; accountInfo?: any }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Twilio is not configured',
        };
      }

      // Test the connection by getting account info
      const account = await this.twilioClient.api.accounts(this.smsConfig.accountSid).fetch();
      
      return {
        success: true,
        message: 'Connection successful',
        accountInfo: {
          accountSid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type,
        },
      };
    } catch (error) {
      this.logger.error('Twilio connection test failed:', error);
      return {
        success: false,
        message: error.message || 'Connection test failed',
      };
    }
  }
}