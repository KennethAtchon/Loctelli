import { ApiClient } from "../client";

export interface SystemInfo {
  environment: string;
  nodeVersion: string;
  timestamp: string;
  database: {
    connected: boolean;
    provider: string;
  };
  cache: {
    connected: boolean;
  };
  config: {
    port: number;
    redisConfigured: boolean;
    databaseConfigured: boolean;
  };
}

export interface CacheClearResponse {
  message: string;
  cleared: number;
}

export interface ConnectionTestResponse {
  connected: boolean;
  message: string;
}

export class DevApi {
  constructor(private client: ApiClient) {}

  /**
   * Get system information (dev only)
   */
  async getSystemInfo(): Promise<SystemInfo> {
    return this.client.request<SystemInfo>("GET", "/dev/system-info");
  }

  /**
   * Clear backend cache (dev only)
   */
  async clearCache(): Promise<CacheClearResponse> {
    return this.client.request<CacheClearResponse>("POST", "/dev/cache/clear");
  }

  /**
   * Test database connection (dev only)
   */
  async testDatabase(): Promise<ConnectionTestResponse> {
    return this.client.request<ConnectionTestResponse>("GET", "/dev/database/test");
  }

  /**
   * Test cache connection (dev only)
   */
  async testCache(): Promise<ConnectionTestResponse> {
    return this.client.request<ConnectionTestResponse>("GET", "/dev/cache/test");
  }
}

