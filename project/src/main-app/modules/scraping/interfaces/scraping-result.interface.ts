export interface ScrapingResult {
  url: string;
  title?: string;
  data: Record<string, any>;
  extractedAt: Date;
  processingTime: number;
  errors?: string[];
  metadata?: {
    statusCode?: number;
    contentType?: string;
    contentLength?: number;
    lastModified?: string;
  };
}

export interface ScrapingStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalPagesScraped: number;
  totalItemsExtracted: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface ScrapingServiceStatus {
  isHealthy: boolean;
  queueLength: number;
  activeWorkers: number;
  averageProcessingTime: number;
  errorRate: number;
  lastError?: string;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}