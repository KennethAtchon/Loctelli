export interface ScrapingJobData {
  id: number;
  name: string;
  description?: string;
  targetUrl: string;
  maxPages: number;
  maxDepth: number;
  selectors: Record<string, string>;
  filters?: Record<string, any>;
  schedule?: Record<string, any>;
  userAgent?: string;
  delayMin: number;
  delayMax: number;
  timeout: number;
}

export interface ScrapingJobResult {
  url: string;
  title?: string;
  data: Record<string, any>;
  extractedAt: Date;
  processingTime: number;
  errors?: string[];
}

export interface ScrapingJobStats {
  totalPages: number;
  processedPages: number;
  extractedItems: number;
  errors: string[];
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
}

export interface ScrapingJobProgress {
  jobId: number;
  status: ScrapingJobStatus;
  progress: number; // 0-100
  currentUrl?: string;
  stats: ScrapingJobStats;
  message?: string;
}

export enum ScrapingJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
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
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface UrlValidationResult {
  isValid: boolean;
  isAccessible: boolean;
  error?: string;
  statusCode?: number;
  title?: string;
}

export interface SelectorValidationResult {
  selector: string;
  isValid: boolean;
  foundElements: number;
  sampleData: string[];
  error?: string;
}