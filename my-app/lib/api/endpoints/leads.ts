import { Apilead } from '../lead';
import { Lead, CreateLeadDto } from '@/types';

export class LeadsApi extends Apilead {
  async getLeads(): Promise<Lead[]> {
    return this.get<Lead[]>('/lead');
  }

  async getLead(id: number): Promise<Lead> {
    return this.get<Lead>(`/lead/${id}`);
  }

  async createLead(data: CreateLeadDto): Promise<Lead> {
    return this.post<Lead>('/lead', data);
  }

  async updateLead(id: number, data: Partial<CreateLeadDto>): Promise<Lead> {
    return this.patch<Lead>(`/lead/${id}`, data);
  }

  async deleteLead(id: number): Promise<void> {
    return this.delete<void>(`/lead/${id}`);
  }

  async getLeadsByUser(userId: number): Promise<Lead[]> {
    return this.get<Lead[]>(`/lead?userId=${userId}`);
  }

  async getLeadsByStrategy(strategyId: number): Promise<Lead[]> {
    return this.get<Lead[]>(`/lead?strategyId=${strategyId}`);
  }
} 