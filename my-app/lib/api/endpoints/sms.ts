import { ApiClient } from '../client';
import { ApiResponse, PaginatedResponse } from '../types';
import {
    SmsMessage,
    SmsCampaign,
    SmsStats,
    CampaignStats,
    SendSmsDto,
    CreateCampaignDto,
    UpdateCampaignDto,
    MessageHistoryParams,
    CampaignListParams,
    PhoneValidationResult,
    BulkSmsResult,
    SmsServiceStatus,
    CsvProcessingResult,
} from '../../../types/sms';

export class SmsApi extends ApiClient {
    /**
     * Send a single SMS message
     */
    async sendSms(data: SendSmsDto): Promise<ApiResponse<SmsMessage>> {
        return this.post<ApiResponse<SmsMessage>>('/sms/send', data);
    }

    /**
     * Send bulk SMS via CSV file upload
     */
    async sendBulkSms(file: File, message: string): Promise<ApiResponse<BulkSmsResult>> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', message);

        return this.request<ApiResponse<BulkSmsResult>>('/sms/bulk', {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData - let browser set it with boundary
            },
        });
    }

    /**
     * Validate phone number
     */
    async validatePhone(phoneNumber: string): Promise<ApiResponse<PhoneValidationResult>> {
        return this.post<ApiResponse<PhoneValidationResult>>('/sms/validate-phone', {
            phoneNumber,
        });
    }

    /**
     * Get SMS service status
     */
    async getServiceStatus(): Promise<ApiResponse<SmsServiceStatus>> {
        return this.get<ApiResponse<SmsServiceStatus>>('/sms/status');
    }

    /**
     * Get SMS message history
     */
    async getMessages(
        params: MessageHistoryParams = {}
    ): Promise<ApiResponse<PaginatedResponse<SmsMessage>>> {
        const queryString = this.buildQueryString(params);
        const endpoint = queryString ? `/sms/messages?${queryString}` : '/sms/messages';
        return this.get<ApiResponse<PaginatedResponse<SmsMessage>>>(endpoint);
    }

    /**
     * Get SMS statistics
     */
    async getStats(): Promise<ApiResponse<SmsStats>> {
        return this.get<ApiResponse<SmsStats>>('/sms/stats');
    }

    /**
     * Export SMS messages to CSV
     */
    async exportMessages(params: MessageHistoryParams = {}): Promise<Blob> {
        const queryString = this.buildQueryString({ ...params, export: 'csv' });
        const endpoint = queryString ? `/sms/messages/export?${queryString}` : '/sms/messages/export';

        const response = await this.request<Blob>(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv',
            },
        });

        return response;
    }

    // Campaign Management Methods

    /**
     * Create SMS campaign
     */
    async createCampaign(data: CreateCampaignDto): Promise<ApiResponse<SmsCampaign>> {
        return this.post<ApiResponse<SmsCampaign>>('/sms/campaigns', data);
    }

    /**
     * Get campaigns list
     */
    async getCampaigns(
        params: CampaignListParams = {}
    ): Promise<ApiResponse<PaginatedResponse<SmsCampaign>>> {
        const queryString = this.buildQueryString(params);
        const endpoint = queryString ? `/sms/campaigns?${queryString}` : '/sms/campaigns';
        return this.get<ApiResponse<PaginatedResponse<SmsCampaign>>>(endpoint);
    }

    /**
     * Get campaign by ID
     */
    async getCampaign(campaignId: number): Promise<ApiResponse<SmsCampaign>> {
        return this.get<ApiResponse<SmsCampaign>>(`/sms/campaigns/${campaignId}`);
    }

    /**
     * Update campaign
     */
    async updateCampaign(
        campaignId: number,
        data: UpdateCampaignDto
    ): Promise<ApiResponse<SmsCampaign>> {
        return this.put<ApiResponse<SmsCampaign>>(`/sms/campaigns/${campaignId}`, data);
    }

    /**
     * Delete campaign
     */
    async deleteCampaign(campaignId: number): Promise<ApiResponse<void>> {
        return this.delete<ApiResponse<void>>(`/sms/campaigns/${campaignId}`);
    }

    /**
     * Get campaign messages
     */
    async getCampaignMessages(
        campaignId: number,
        params: { page?: number; limit?: number } = {}
    ): Promise<ApiResponse<PaginatedResponse<SmsMessage>>> {
        const queryString = this.buildQueryString(params);
        const endpoint = queryString
            ? `/sms/campaigns/${campaignId}/messages?${queryString}`
            : `/sms/campaigns/${campaignId}/messages`;
        return this.get<ApiResponse<PaginatedResponse<SmsMessage>>>(endpoint);
    }

    /**
     * Start campaign (for scheduled campaigns)
     */
    async startCampaign(campaignId: number): Promise<ApiResponse<SmsCampaign>> {
        return this.post<ApiResponse<SmsCampaign>>(`/sms/campaigns/${campaignId}/start`);
    }

    /**
     * Pause campaign
     */
    async pauseCampaign(campaignId: number): Promise<ApiResponse<SmsCampaign>> {
        return this.post<ApiResponse<SmsCampaign>>(`/sms/campaigns/${campaignId}/pause`);
    }

    /**
     * Resume campaign
     */
    async resumeCampaign(campaignId: number): Promise<ApiResponse<SmsCampaign>> {
        return this.post<ApiResponse<SmsCampaign>>(`/sms/campaigns/${campaignId}/resume`);
    }

    /**
     * Get campaign statistics
     */
    async getCampaignStats(): Promise<ApiResponse<CampaignStats>> {
        return this.get<ApiResponse<CampaignStats>>('/sms/campaigns/stats');
    }

    /**
     * Duplicate campaign
     */
    async duplicateCampaign(campaignId: number): Promise<ApiResponse<SmsCampaign>> {
        return this.post<ApiResponse<SmsCampaign>>(`/sms/campaigns/${campaignId}/duplicate`);
    }

    /**
     * Preview campaign (validate recipients without sending)
     */
    async previewCampaign(data: CreateCampaignDto): Promise<ApiResponse<CsvProcessingResult>> {
        return this.post<ApiResponse<CsvProcessingResult>>('/sms/campaigns/preview', data);
    }

    // Utility Methods

    /**
     * Process CSV file for validation (without sending)
     */
    async processCsv(file: File): Promise<ApiResponse<CsvProcessingResult>> {
        const formData = new FormData();
        formData.append('file', file);

        return this.request<ApiResponse<CsvProcessingResult>>('/sms/csv/process', {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData
            },
        });
    }

    /**
     * Get CSV template for bulk SMS
     */
    async getCsvTemplate(): Promise<Blob> {
        return this.request<Blob>('/sms/csv/template', {
            method: 'GET',
            headers: {
                'Accept': 'text/csv',
            },
        });
    }

    /**
     * Validate CSV structure
     */
    async validateCsv(file: File): Promise<ApiResponse<{
        isValid: boolean;
        hasPhoneColumn: boolean;
        columnNames: string[];
        sampleRows: any[];
        error?: string;
    }>> {
        const formData = new FormData();
        formData.append('file', file);

        return this.request<ApiResponse<{
            isValid: boolean;
            hasPhoneColumn: boolean;
            columnNames: string[];
            sampleRows: any[];
            error?: string;
        }>>('/sms/csv/validate', {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData
            },
        });
    }

    // Settings and Configuration

    /**
     * Get SMS settings
     */
    async getSettings(): Promise<ApiResponse<{
        rateLimitPerMinute: number;
        maxBatchSize: number;
        retryAttempts: number;
        twilioConfigured: boolean;
    }>> {
        return this.get<ApiResponse<{
            rateLimitPerMinute: number;
            maxBatchSize: number;
            retryAttempts: number;
            twilioConfigured: boolean;
        }>>('/sms/settings');
    }

    /**
     * Update SMS settings (admin only)
     */
    async updateSettings(settings: {
        rateLimitPerMinute?: number;
        maxBatchSize?: number;
        retryAttempts?: number;
    }): Promise<ApiResponse<void>> {
        return this.put<ApiResponse<void>>('/sms/settings', settings);
    }

    /**
     * Test Twilio connection
     */
    async testConnection(): Promise<ApiResponse<{
        success: boolean;
        message: string;
        accountInfo?: any;
    }>> {
        return this.post<ApiResponse<{
            success: boolean;
            message: string;
            accountInfo?: any;
        }>>('/sms/test-connection');
    }

    /**
     * Update Twilio configuration
     */
    async updateTwilioConfig(config: {
        accountSid: string;
        authToken: string;
        phoneNumber: string;
    }): Promise<ApiResponse<void>> {
        return this.put<ApiResponse<void>>('/sms/twilio-config', config);
    }

    /**
     * Get Twilio configuration (admin only)
     */
    async getTwilioConfig(): Promise<ApiResponse<{
        accountSid?: string;
        phoneNumber?: string;
        configured: boolean;
    }>> {
        return this.get<ApiResponse<{
            accountSid?: string;
            phoneNumber?: string;
            configured: boolean;
        }>>('/sms/twilio-config');
    }
}