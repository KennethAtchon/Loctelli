// SMS Message Types
export interface SmsMessage {
  id: number;
  userId: number;
  subAccountId: number;
  phoneNumber: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  twilioSid?: string;
  errorMessage?: string;
  campaignId?: number;
  campaign?: {
    id: number;
    name: string;
  };
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// SMS Campaign Types
export type CampaignStatus = 'draft' | 'sending' | 'completed' | 'failed';

export interface SmsCampaign {
  id: number;
  userId: number;
  subAccountId: number;
  name: string;
  message: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SmsMessage[];
}

// SMS Statistics Types
export interface SmsStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalPending: number;
  monthlyStats: {
    [key: string]: {
      sent: number;
      delivered: number;
      failed: number;
    };
  };
  recentMessages: SmsMessage[];
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
}

// DTO Types for API requests
export interface SendSmsDto {
  phoneNumber: string;
  message: string;
}

export interface CreateCampaignDto {
  name: string;
  message: string;
  recipients: string[];
  scheduledAt?: Date;
}

export interface UpdateCampaignDto {
  name?: string;
  message?: string;
  scheduledAt?: Date;
  status?: CampaignStatus;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Query Parameters
export interface MessageHistoryParams {
  page?: number;
  limit?: number;
  status?: string;
  campaignId?: number;
  phoneNumber?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

export interface CampaignListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  [key: string]: unknown;
}

// Phone Validation Types
export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  country?: string;
  error?: string;
}

// CSV Processing Types
export interface CsvProcessingResult {
  totalRows: number;
  validNumbers: string[];
  invalidNumbers: string[];
  duplicates: string[];
  errors: string[];
}

// Bulk SMS Types
export interface BulkSmsResult {
  campaignId: number;
  totalRecipients: number;
  invalidNumbers: number;
  duplicates: number;
  errors: string[];
}

// SMS Service Status
export interface SmsServiceStatus {
  configured: boolean;
  rateLimitPerMinute: number;
  maxBatchSize: number;
  retryAttempts: number;
}

// Form Types
export interface SendSmsFormData {
  phoneNumber: string;
  message: string;
}

export interface BulkSmsFormData {
  file: File | null;
  message: string;
}

export interface CampaignFormData {
  name: string;
  message: string;
  recipients: string[];
  scheduledAt?: Date;
}

// Table Column Types
export interface SmsHistoryColumn {
  key: keyof SmsMessage | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface CampaignColumn {
  key: keyof SmsCampaign | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

// Filter Types
export interface SmsFilters {
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  phoneNumber?: string;
  campaignId?: number;
}

export interface CampaignFilters {
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}