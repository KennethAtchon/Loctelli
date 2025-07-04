import { ApiClient } from '../client';
import { Strategy, CreateStrategyDto } from '@/types';

export class StrategiesApi extends ApiClient {
  async getStrategies(): Promise<Strategy[]> {
    return this.get<Strategy[]>('/strategies');
  }

  async getStrategy(id: number): Promise<Strategy> {
    return this.get<Strategy>(`/strategies/${id}`);
  }

  async createStrategy(data: CreateStrategyDto): Promise<Strategy> {
    return this.post<Strategy>('/strategies', data);
  }

  async updateStrategy(id: number, data: Partial<CreateStrategyDto>): Promise<Strategy> {
    return this.patch<Strategy>(`/strategies/${id}`, data);
  }

  async deleteStrategy(id: number): Promise<void> {
    return this.delete<void>(`/strategies/${id}`);
  }

  async getStrategiesByUser(userId: number): Promise<Strategy[]> {
    return this.get<Strategy[]>(`/strategies?userId=${userId}`);
  }

  async duplicateStrategy(id: number): Promise<Strategy> {
    return this.post<Strategy>(`/strategies/${id}/duplicate`);
  }
} 