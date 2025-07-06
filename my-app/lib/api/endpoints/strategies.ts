import { Apilead } from '../lead';
import { Strategy, CreateStrategyDto } from '@/types';

export class StrategiesApi extends Apilead {
  async getStrategies(): Promise<Strategy[]> {
    return this.get<Strategy[]>('/strategy');
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