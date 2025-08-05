import { ApiClient } from '../client';
import { ApiResponse, PaginatedResponse } from '../types';
import {
    ScrapingJob,
    ScrapingConfig,
    ScrapingStats,
    ScrapingServiceStatus,
    ScrapingResult,
    UrlValidationResult,
    SelectorValidationResult,
    CreateScrapingJobDto,
    UpdateScrapingJobDto,
    CreateScrapingConfigDto,
    ScrapingJobStatus,
} from '../../../types/scraping';

export class ScrapingApi extends ApiClient {
    // Job Management

    /**
     * Create new scraping job
     */
    async createJob(data: CreateScrapingJobDto): Promise<ApiResponse<ScrapingJob>> {
        return this.post<ApiResponse<ScrapingJob>>('/scraping/jobs', data);
    }

    /**
     * Get user's scraping jobs (paginated)
     */
    async getJobs(params: {
        page?: number;
        limit?: number;
        status?: ScrapingJobStatus;
        subAccountId?: number;
    } = {}): Promise<ApiResponse<PaginatedResponse<ScrapingJob>>> {
        const queryString = this.buildQueryString(params);
        const endpoint = queryString ? `/scraping/jobs?${queryString}` : '/scraping/jobs';
        return this.get<ApiResponse<PaginatedResponse<ScrapingJob>>>(endpoint);
    }

    /**
     * Get specific scraping job details
     */
    async getJob(jobId: number): Promise<ApiResponse<ScrapingJob>> {
        return this.get<ApiResponse<ScrapingJob>>(`/scraping/jobs/${jobId}`);
    }

    /**
     * Update scraping job
     */
    async updateJob(jobId: number, data: UpdateScrapingJobDto): Promise<ApiResponse<ScrapingJob>> {
        return this.put<ApiResponse<ScrapingJob>>(`/scraping/jobs/${jobId}`, data);
    }

    /**
     * Delete scraping job
     */
    async deleteJob(jobId: number): Promise<ApiResponse<void>> {
        return this.delete<ApiResponse<void>>(`/scraping/jobs/${jobId}`);
    }

    // Job Control

    /**
     * Start/resume scraping job
     */
    async startJob(jobId: number, reason?: string): Promise<ApiResponse<ScrapingJob>> {
        return this.post<ApiResponse<ScrapingJob>>(`/scraping/jobs/${jobId}/start`, { reason });
    }

    /**
     * Pause scraping job
     */
    async pauseJob(jobId: number, reason?: string): Promise<ApiResponse<ScrapingJob>> {
        return this.post<ApiResponse<ScrapingJob>>(`/scraping/jobs/${jobId}/pause`, { reason });
    }

    /**
     * Cancel scraping job
     */
    async cancelJob(jobId: number, reason?: string): Promise<ApiResponse<ScrapingJob>> {
        return this.post<ApiResponse<ScrapingJob>>(`/scraping/jobs/${jobId}/cancel`, { reason });
    }

    // Results & Export

    /**
     * Get job results (paginated)
     */
    async getJobResults(jobId: number, params: {
        page?: number;
        limit?: number;
    } = {}): Promise<ApiResponse<PaginatedResponse<ScrapingResult>>> {
        const queryString = this.buildQueryString(params);
        const endpoint = queryString 
            ? `/scraping/jobs/${jobId}/results?${queryString}` 
            : `/scraping/jobs/${jobId}/results`;
        return this.get<ApiResponse<PaginatedResponse<ScrapingResult>>>(endpoint);
    }

    /**
     * Export job results
     */
    async exportJobResults(jobId: number, format: 'csv' | 'json' = 'json'): Promise<Blob> {
        const response = await this.request<Blob>(`/scraping/jobs/${jobId}/export?format=${format}`, {
            method: 'GET',
            headers: {
                'Accept': format === 'csv' ? 'text/csv' : 'application/json',
            },
        });
        return response;
    }

    /**
     * Preview job results (limited)
     */
    async previewJobResults(jobId: number, limit: number = 5): Promise<ApiResponse<{
        preview: ScrapingResult[];
        total: number;
        hasMore: boolean;
    }>> {
        return this.get<ApiResponse<{
            preview: ScrapingResult[];
            total: number;
            hasMore: boolean;
        }>>(`/scraping/jobs/${jobId}/preview?limit=${limit}`);
    }

    // Statistics & Monitoring

    /**
     * Get scraping statistics
     */
    async getStats(subAccountId?: number): Promise<ApiResponse<ScrapingStats>> {
        const query = subAccountId ? `?subAccountId=${subAccountId}` : '';
        return this.get<ApiResponse<ScrapingStats>>(`/scraping/stats${query}`);
    }

    /**
     * Get dashboard data (optimized - single API call)
     */
    async getDashboardData(): Promise<ApiResponse<{
        stats: ScrapingStats;
        recentJobs: ScrapingJob[];
        activeJobs: ScrapingJob[];
        serviceStatus: ScrapingServiceStatus;
    }>> {
        return this.get<ApiResponse<{
            stats: ScrapingStats;
            recentJobs: ScrapingJob[];
            activeJobs: ScrapingJob[];
            serviceStatus: ScrapingServiceStatus;
        }>>('/scraping/dashboard');
    }

    /**
     * Get real-time job status
     */
    async getJobStatus(jobId: number): Promise<ApiResponse<{
        id: number;
        status: ScrapingJobStatus;
        progress: number;
        totalPages: number;
        processedPages: number;
        extractedItems: number;
        errors: any;
        startedAt?: string;
        updatedAt: string;
    }>> {
        return this.get<ApiResponse<{
            id: number;
            status: ScrapingJobStatus;
            progress: number;
            totalPages: number;
            processedPages: number;
            extractedItems: number;
            errors: any;
            startedAt?: string;
            updatedAt: string;
        }>>(`/scraping/jobs/${jobId}/status`);
    }

    /**
     * Get job execution logs
     */
    async getJobLogs(jobId: number): Promise<ApiResponse<{
        logs: string[];
        lastUpdated: string;
    }>> {
        return this.get<ApiResponse<{
            logs: string[];
            lastUpdated: string;
        }>>(`/scraping/jobs/${jobId}/logs`);
    }

    // Configuration Management

    /**
     * Save scraping configuration
     */
    async saveConfig(data: CreateScrapingConfigDto): Promise<ApiResponse<ScrapingConfig>> {
        return this.post<ApiResponse<ScrapingConfig>>('/scraping/configs', data);
    }

    /**
     * Get saved configurations
     */
    async getConfigs(subAccountId?: number): Promise<ApiResponse<ScrapingConfig[]>> {
        const query = subAccountId ? `?subAccountId=${subAccountId}` : '';
        return this.get<ApiResponse<ScrapingConfig[]>>(`/scraping/configs${query}`);
    }

    /**
     * Update scraping configuration
     */
    async updateConfig(configId: number, data: Partial<CreateScrapingConfigDto>): Promise<ApiResponse<ScrapingConfig>> {
        return this.put<ApiResponse<ScrapingConfig>>(`/scraping/configs/${configId}`, data);
    }

    /**
     * Delete scraping configuration
     */
    async deleteConfig(configId: number): Promise<ApiResponse<void>> {
        return this.delete<ApiResponse<void>>(`/scraping/configs/${configId}`);
    }

    // Service Status & Utilities

    /**
     * Check scraping service health
     */
    async getServiceStatus(): Promise<ApiResponse<ScrapingServiceStatus>> {
        return this.get<ApiResponse<ScrapingServiceStatus>>('/scraping/service-status');
    }

    /**
     * Test URL accessibility
     */
    async testUrl(url: string): Promise<ApiResponse<UrlValidationResult>> {
        return this.post<ApiResponse<UrlValidationResult>>('/scraping/test-url', { url });
    }

    /**
     * Validate CSS selectors
     */
    async validateSelectors(url: string, selectors: Record<string, string>): Promise<ApiResponse<SelectorValidationResult[]>> {
        return this.post<ApiResponse<SelectorValidationResult[]>>('/scraping/validate-selectors', {
            url,
            selectors,
        });
    }

    // Utility Methods

    /**
     * Create job from configuration template
     */
    async createJobFromConfig(configId: number, overrides: Partial<CreateScrapingJobDto> = {}): Promise<ApiResponse<ScrapingJob>> {
        return this.post<ApiResponse<ScrapingJob>>(`/scraping/configs/${configId}/create-job`, overrides);
    }

    /**
     * Duplicate existing job
     */
    async duplicateJob(jobId: number, name?: string): Promise<ApiResponse<ScrapingJob>> {
        return this.post<ApiResponse<ScrapingJob>>(`/scraping/jobs/${jobId}/duplicate`, { name });
    }

    /**
     * Get job progress with real-time updates
     */
    async pollJobProgress(jobId: number, interval: number = 2000): Promise<{
        subscribe: (callback: (progress: any) => void) => void;
        unsubscribe: () => void;
    }> {
        let intervalId: NodeJS.Timeout | null = null;
        let isActive = false;

        return {
            subscribe: (callback: (progress: any) => void) => {
                if (isActive) return;
                isActive = true;

                const poll = async () => {
                    try {
                        const response = await this.getJobStatus(jobId);
                        if (response.success) {
                            callback(response.data);
                        }
                    } catch (error) {
                        console.error('Error polling job progress:', error);
                    }
                };

                // Initial poll
                poll();

                // Set up interval
                intervalId = setInterval(poll, interval);
            },
            unsubscribe: () => {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
                isActive = false;
            }
        };
    }

    /**
     * Batch job operations
     */
    async batchJobOperation(jobIds: number[], operation: 'start' | 'pause' | 'cancel'): Promise<ApiResponse<{
        successful: number[];
        failed: { jobId: number; error: string }[];
    }>> {
        return this.post<ApiResponse<{
            successful: number[];
            failed: { jobId: number; error: string }[];
        }>>('/scraping/jobs/batch', {
            jobIds,
            operation,
        });
    }

    /**
     * Get job statistics for specific time range
     */
    async getJobStatsForPeriod(params: {
        startDate: string;
        endDate: string;
        subAccountId?: number;
    }): Promise<ApiResponse<{
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        totalPagesScraped: number;
        totalItemsExtracted: number;
        averageProcessingTime: number;
        dailyStats: Array<{
            date: string;
            jobs: number;
            pages: number;
            items: number;
        }>;
    }>> {
        const queryString = this.buildQueryString(params);
        return this.get<ApiResponse<{
            totalJobs: number;
            completedJobs: number;
            failedJobs: number;
            totalPagesScraped: number;
            totalItemsExtracted: number;
            averageProcessingTime: number;
            dailyStats: Array<{
                date: string;
                jobs: number;
                pages: number;
                items: number;
            }>;
        }>>(`/scraping/stats/period?${queryString}`);
    }

    /**
     * Search jobs by URL pattern
     */
    async searchJobs(params: {
        query?: string;
        urlPattern?: string;
        status?: ScrapingJobStatus;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<PaginatedResponse<ScrapingJob>>> {
        const queryString = this.buildQueryString(params);
        return this.get<ApiResponse<PaginatedResponse<ScrapingJob>>>(`/scraping/jobs/search?${queryString}`);
    }
}