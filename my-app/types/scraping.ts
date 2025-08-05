export interface ScrapingJob {
  id: number;
  name: string;
  description?: string;
  status: ScrapingJobStatus;
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
  totalPages: number;
  processedPages: number;
  extractedItems: number;
  errors?: any;
  results?: any;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  userId: number;
  subAccountId: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ScrapingConfig {
  id: number;
  name: string;
  description?: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  userId: number;
  subAccountId: number;
}

export interface ScrapingResult {
  url: string;
  title?: string;
  data: Record<string, any>;
  extractedAt: string;
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

export interface ScrapingJobProgress {
  jobId: number;
  status: ScrapingJobStatus;
  progress: number; // 0-100
  currentUrl?: string;
  stats: {
    totalPages: number;
    processedPages: number;
    extractedItems: number;
    errors: string[];
    startedAt?: string;
    completedAt?: string;
    estimatedTimeRemaining?: number;
  };
  message?: string;
}

export interface UrlValidationResult {
  isValid: boolean;
  isAccessible: boolean;
  statusCode?: number;
  contentType?: string;
  title?: string;
  error?: string;
  redirectUrl?: string;
}

export interface SelectorValidationResult {
  selector: string;
  isValid: boolean;
  foundElements: number;
  sampleData?: string[];
  error?: string;
}

export interface PaginatedResponse<T> {
  jobs?: T[];
  results?: T[];
  data?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export enum ScrapingJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Form DTOs
export interface CreateScrapingJobDto {
  name: string;
  description?: string;
  targetUrl: string;
  maxPages?: number;
  maxDepth?: number;
  selectors: Record<string, string>;
  filters?: Record<string, any>;
  schedule?: Record<string, any>;
  userAgent?: string;
  delayMin?: number;
  delayMax?: number;
  timeout?: number;
}

export interface UpdateScrapingJobDto {
  name?: string;
  description?: string;
  targetUrl?: string;
  maxPages?: number;
  maxDepth?: number;
  selectors?: Record<string, string>;
  filters?: Record<string, any>;
  schedule?: Record<string, any>;
  userAgent?: string;
  delayMin?: number;
  delayMax?: number;
  timeout?: number;
}

export interface CreateScrapingConfigDto {
  name: string;
  description?: string;
  config: Record<string, any>;
}

export interface ScrapingSelector {
  name: string;
  selector: string;
  attribute?: string; // 'text', 'href', 'src', or any attribute name
  multiple?: boolean; // Whether to extract multiple elements
  required?: boolean; // Whether this field is required
}

export interface ScrapingFilter {
  field: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'exists';
  value?: string;
  caseSensitive?: boolean;
}