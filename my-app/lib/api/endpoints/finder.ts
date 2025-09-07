import { ApiClient } from '../client';

export interface SearchBusinessDto {
  query: string;
  location?: string;
  radius?: number;
  category?: string;
  sources?: string[];
  limit?: number;
}

export interface BusinessSearchResultDto {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  priceLevel?: string;
  categories?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  source: string;
  sourceId: string;
  businessHours?: {
    [key: string]: string;
  };
  photos?: string[];
  reviews?: {
    count: number;
    averageRating: number;
  };
}

export interface SearchResponseDto {
  searchId: string;
  query: string;
  location?: string;
  totalResults: number;
  results: BusinessSearchResultDto[];
  sources: string[];
  responseTime: number;
  cached: boolean;
  expiresAt: string;
}

export interface ExportResultsDto {
  searchId: string;
  format: 'csv' | 'json' | 'txt' | 'pdf';
  fields?: string[];
  filename?: string;
  sources?: string[];
}

export interface ApiKeyDto {
  service: string;
  keyName: string;
  keyValue: string;
  dailyLimit?: number;
}

export interface RateLimitStatus {
  currentUsage: number;
  dailyLimit: number;
  remaining: number;
  resetTime: string;
  isBlocked: boolean;
}

export interface UsageStats {
  totalSearches: number;
  totalResults: number;
  averageResponseTime: number;
  sourcesUsed: Record<string, number>;
  currentUsage: number;
  dailyLimit: number;
  remaining: number;
  isBlocked: boolean;
}

export interface SearchHistory {
  id: string;
  query: string;
  location?: string;
  totalResults: number;
  sources: string[];
  responseTime?: number;
  createdAt: string;
  expiresAt: string;
}

export interface ApiSource {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  freeQuota: string;
}

export interface JobStatusDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found' | 'error';
  progress?: number;
  result?: any;
  error?: string;
  createdAt?: string;
  completedAt?: string;
  searchResult?: SearchResponseDto;
}

export class FinderApi extends ApiClient {
  // Search operations
  async searchBusinesses(data: SearchBusinessDto): Promise<SearchResponseDto> {
    return this.post<SearchResponseDto>('/admin/finder/search', data);
  }

  async searchBusinessesAsync(data: SearchBusinessDto): Promise<{ jobId: string; message: string; status: string }> {
    return this.post<{ jobId: string; message: string; status: string }>('/admin/finder/search-async', data);
  }

  async getJobStatus(jobId: string): Promise<JobStatusDto> {
    return this.get<JobStatusDto>(`/admin/finder/jobs/${jobId}`);
  }

  async getSearchResult(searchId: string): Promise<SearchResponseDto> {
    return this.get<SearchResponseDto>(`/admin/finder/results/${searchId}`);
  }

  async getSearchHistory(subAccountId?: number, limit?: number): Promise<SearchHistory[]> {
    const params = new URLSearchParams();
    if (subAccountId) params.append('subAccountId', subAccountId.toString());
    if (limit) params.append('limit', limit.toString());
    return this.get<SearchHistory[]>(`/admin/finder/history?${params.toString()}`);
  }

  // Export operations
  async exportResults(data: ExportResultsDto): Promise<Blob> {
    return this.post<Blob>('/admin/finder/export', data, {
      responseType: 'blob',
    });
  }

  async getAvailableFields(): Promise<{ fields: string[] }> {
    return this.get<{ fields: string[] }>('/admin/finder/export/fields');
  }

  // API key management
  async getUserApiKeys(): Promise<Array<Omit<ApiKeyDto, 'keyValue'> & { usageCount: number; lastUsed?: string }>> {
    return this.get<Array<Omit<ApiKeyDto, 'keyValue'> & { usageCount: number; lastUsed?: string }>>('/admin/finder/api-keys');
  }

  async saveApiKey(data: ApiKeyDto): Promise<{ message: string }> {
    return this.put<{ message: string }>('/admin/finder/api-keys', data);
  }

  async deleteApiKey(service: string, keyName: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/admin/finder/api-keys/${service}/${keyName}`);
  }

  // Rate limiting
  async getRateLimitStatus(service?: string): Promise<RateLimitStatus> {
    const params = service ? `?service=${service}` : '';
    return this.get<RateLimitStatus>(`/admin/finder/rate-limit/status${params}`);
  }

  async resetRateLimit(service?: string): Promise<{ message: string }> {
    const params = service ? `?service=${service}` : '';
    return this.post<{ message: string }>(`/admin/finder/rate-limit/reset${params}`);
  }

  // Utility endpoints
  async getAvailableSources(): Promise<{ sources: ApiSource[] }> {
    return this.get<{ sources: ApiSource[] }>('/admin/finder/sources');
  }

  async getUsageStats(): Promise<UsageStats> {
    return this.get<UsageStats>('/admin/finder/stats');
  }
}