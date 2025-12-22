import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { statusConfig } from "../config/status.config";

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
  private api: EndpointApi<typeof statusConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(statusConfig);
  }

  async getStatus(): Promise<SystemStatus> {
    return this.api.getStatus() as Promise<SystemStatus>;
  }

  async getHealth(): Promise<{ status: string }> {
    return this.api.getHealth() as Promise<{ status: string }>;
  }

  async getVersion(): Promise<{ version: string }> {
    return this.api.getVersion() as Promise<{ version: string }>;
  }
}
