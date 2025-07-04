import { ApiClient } from '../client';
import { Client, CreateClientDto } from '@/types';

export class ClientsApi extends ApiClient {
  async getClients(): Promise<Client[]> {
    return this.get<Client[]>('/clients');
  }

  async getClient(id: number): Promise<Client> {
    return this.get<Client>(`/clients/${id}`);
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    return this.post<Client>('/clients', data);
  }

  async updateClient(id: number, data: Partial<CreateClientDto>): Promise<Client> {
    return this.patch<Client>(`/clients/${id}`, data);
  }

  async deleteClient(id: number): Promise<void> {
    return this.delete<void>(`/clients/${id}`);
  }

  async getClientsByUser(userId: number): Promise<Client[]> {
    return this.get<Client[]>(`/clients?userId=${userId}`);
  }

  async getClientsByStrategy(strategyId: number): Promise<Client[]> {
    return this.get<Client[]>(`/clients?strategyId=${strategyId}`);
  }
} 