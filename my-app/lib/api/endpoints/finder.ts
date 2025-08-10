import { apiClient } from '../client';

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

export const finderApi = {
  // Search operations
  searchBusinesses: (data: SearchBusinessDto): Promise<SearchResponseDto> =>
    apiClient.post('/admin/finder/search', data),

  getSearchResult: (searchId: string): Promise<SearchResponseDto> =>
    apiClient.get(`/admin/finder/results/${searchId}`),

  getSearchHistory: (subAccountId?: number, limit?: number): Promise<SearchHistory[]> => {
    const params = new URLSearchParams();
    if (subAccountId) params.append('subAccountId', subAccountId.toString());
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/admin/finder/history?${params.toString()}`);
  },

  // Export operations
  exportResults: (data: ExportResultsDto): Promise<Blob> =>
    apiClient.post('/admin/finder/export', data, {
      responseType: 'blob',
    }) as Promise<Blob>,

  getAvailableFields: (): Promise<{ fields: string[] }> =>
    apiClient.get('/admin/finder/export/fields'),

  // API key management
  getUserApiKeys: (): Promise<Array<Omit<ApiKeyDto, 'keyValue'> & { usageCount: number; lastUsed?: string }>> =>
    apiClient.get('/admin/finder/api-keys'),

  saveApiKey: (data: ApiKeyDto): Promise<{ message: string }> =>
    apiClient.put('/admin/finder/api-keys', data),

  deleteApiKey: (service: string, keyName: string): Promise<{ message: string }> =>
    apiClient.delete(`/admin/finder/api-keys/${service}/${keyName}`),

  // Rate limiting
  getRateLimitStatus: (service?: string): Promise<RateLimitStatus> => {
    const params = service ? `?service=${service}` : '';
    return apiClient.get(`/admin/finder/rate-limit/status${params}`);
  },

  resetRateLimit: (service?: string): Promise<{ message: string }> => {
    const params = service ? `?service=${service}` : '';
    return apiClient.post(`/admin/finder/rate-limit/reset${params}`);
  },

  // Utility endpoints
  getAvailableSources: (): Promise<{ sources: ApiSource[] }> =>
    apiClient.get('/admin/finder/sources'),

  getUsageStats: (): Promise<UsageStats> =>
    apiClient.get('/admin/finder/stats'),
};