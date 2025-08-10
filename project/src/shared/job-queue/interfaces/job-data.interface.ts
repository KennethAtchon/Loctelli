export type JobType = 'email' | 'sms' | 'data-export' | 'file-processing' | 'generic-task';

export interface BaseJobData {
  subAccountId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EmailJobData extends BaseJobData {
  to: string[];
  subject: string;
  template: string;
  templateData?: Record<string, any>;
}

export interface SmsJobData extends BaseJobData {
  phoneNumbers: string[];
  message: string;
  campaignId?: string;
}

export interface DataExportJobData extends BaseJobData {
  exportType: 'leads' | 'bookings' | 'users';
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  columns?: string[];
}

export interface GenericTaskJobData extends BaseJobData {
  taskName: string;
  functionName: string;
  serviceName?: string;
  parameters: any[];
  context?: Record<string, any>;
}

export type JobData = EmailJobData | SmsJobData | DataExportJobData | GenericTaskJobData;