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

export interface ScrapingConfig {
  name: string;
  description?: string;
  targetUrl: string;
  maxPages: number;
  maxDepth: number;
  selectors: ScrapingSelector[];
  filters?: ScrapingFilter[];
  followLinks?: {
    enabled: boolean;
    linkSelector?: string;
    allowedDomains?: string[];
    excludePatterns?: string[];
  };
  browserOptions?: {
    userAgent?: string;
    delayMin: number;
    delayMax: number;
    timeout: number;
    headless?: boolean;
    viewport?: {
      width: number;
      height: number;
    };
    blockResources?: string[]; // 'image', 'stylesheet', 'font', etc.
  };
  scheduling?: {
    enabled: boolean;
    cron?: string;
    timezone?: string;
  };
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