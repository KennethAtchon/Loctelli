import { ApiClient } from '../client';
import { Client, CreateClientDto } from '@/types';

export class ClientsApi extends ApiClient {
  async getClients(): Promise<Client[]> {
    return this.get<Client[]>('/client');
  }

  async getClient(id: number): Promise<Client> {
    return this.get<Client>(`/client/${id}`);
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    return this.post<Client>('/client', data);
  }

  async updateClient(id: number, data: Partial<CreateClientDto>): Promise<Client> {
    return this.patch<Client>(`/client/${id}`, data);
  }

  async deleteClient(id: number): Promise<void> {
    return this.delete<void>(`/client/${id}`);
  }

  async getClientsByUser(userId: number): Promise<Client[]> {
    return this.get<Client[]>(`/client?userId=${userId}`);
  }

  async getClientsByStrategy(strategyId: number): Promise<Client[]> {
    return this.get<Client[]>(`/client?strategyId=${strategyId}`);
  }
} 