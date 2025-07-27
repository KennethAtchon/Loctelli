export interface SmsConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface SmsMessage {
  phoneNumber: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  twilioSid?: string;
  error?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface BulkSmsResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: SmsResult[];
  errors: string[];
}

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  country?: string;
  error?: string;
}

export interface SmsServiceInterface {
  sendSms(phoneNumber: string, message: string): Promise<SmsResult>;
  sendBulkSms(messages: SmsMessage[]): Promise<BulkSmsResult>;
  validatePhoneNumber(phoneNumber: string): PhoneValidationResult;
  formatMessage(message: string): string;
}