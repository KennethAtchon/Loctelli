import { ApiClient } from '../client';

export interface SystemStatus {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
    api: boolean;
  };
}

export class StatusApi {
  constructor(private client: ApiClient) {}
  
  async getStatus(): Promise<SystemStatus> {
    return this.client.get<SystemStatus>('/status');
  }

  async getHealth(): Promise<{ status: string }> {
    return this.client.get<{ status: string }>('/status/health');
  }

  async getVersion(): Promise<{ version: string }> {
    return this.client.get<{ version: string }>('/status/version');
  }
} 