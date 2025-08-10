import { Injectable } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import { SmsJobData } from '../interfaces/job-data.interface';
import { SmsService } from '../../sms/sms.service';

@Injectable()
export class SmsProcessor extends BaseProcessor {
  constructor(private smsService: SmsService) {
    super();
  }

  async process(data: SmsJobData): Promise<any> {
    this.logStart('SMS', data);
    
    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const phoneNumber of data.phoneNumbers) {
      try {
        const result = await this.smsService.sendSms(phoneNumber, data.message);
        results.push({ phoneNumber, status: 'sent', messageId: result.messageId });
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
        results.push({ phoneNumber, status: 'failed', error: error.message });
        failCount++;
      }
    }

    const summary = {
      total: data.phoneNumbers.length,
      successful: successCount,
      failed: failCount,
      results,
    };

    this.logSuccess('SMS', summary);
    return summary;
  }
}