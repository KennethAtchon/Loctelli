import { ApiClient } from '../client';
import { Strategy, CreateStrategyDto } from '@/types';

export class StrategiesApi extends ApiClient {
  async getStrategies(params?: { subAccountId?: number; userId?: number }): Promise<Strategy[]> {
    const queryParams = new URLSearchParams();
    if (params?.subAccountId) {
      queryParams.append('subAccountId', params.subAccountId.toString());
    }
    if (params?.userId) {
      queryParams.append('userId', params.userId.toString());
    }
    const queryString = queryParams.toString();
    return this.get<Strategy[]>(`/strategy${queryString ? `?${queryString}` : ''}`);
  }

  async getStrategy(id: number): Promise<Strategy> {
    return this.get<Strategy>(`/strategy/${id}`);
  }

  async createStrategy(data: CreateStrategyDto): Promise<Strategy> {
    return this.post<Strategy>('/strategy', data);
  }

  async updateStrategy(id: number, data: Partial<CreateStrategyDto>): Promise<Strategy> {
    return this.patch<Strategy>(`/strategy/${id}`, data);
  }

  async deleteStrategy(id: number): Promise<void> {
    return this.delete<void>(`/strategy/${id}`);
  }

  async getStrategiesByUser(userId: number): Promise<Strategy[]> {
    return this.get<Strategy[]>(`/strategy?userId=${userId}`);
  }

  async duplicateStrategy(id: number): Promise<Strategy> {
    return this.post<Strategy>(`/strategy/${id}/duplicate`);
  }
} 