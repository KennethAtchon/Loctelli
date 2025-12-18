import { ApiClient } from "../client";

export interface Integration {
  id: number;
  subAccountId: number;
  integrationTemplateId: number;
  name: string;
  description?: string;
  isActive: boolean;
  config: Record<string, unknown>; // Can be typed based on integration template
  status: "pending" | "active" | "error" | "disconnected";
  lastSyncAt?: string;
  errorMessage?: string;
  webhookSecret?: string;
  createdAt: string;
  updatedAt: string;
  createdByAdmin: {
    id: number;
    name: string;
    email: string;
  };
  subAccount: {
    id: number;
    name: string;
  };
  integrationTemplate: {
    id: number;
    name: string;
    displayName: string;
    category: string;
    icon?: string;
    configSchema?: {
      required?: string[];
      properties?: Record<
        string,
        { type: string; title?: string; description?: string }
      >;
    };
  };
}

export interface CreateIntegrationDto {
  subAccountId: number;
  integrationTemplateId: number;
  name: string;
  description?: string;
  isActive?: boolean;
  config: Record<string, unknown>;
  status?: string;
  errorMessage?: string;
  webhookSecret?: string;
}

export type UpdateIntegrationDto = Partial<CreateIntegrationDto>;

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  integration: string;
}

export interface SyncDataResponse {
  success: boolean;
  message: string;
  integration: string;
  lastSyncAt: string;
}

export class IntegrationsApi {
  constructor(private client: ApiClient) {}

  async getAll(subAccountId?: number): Promise<Integration[]> {
    const params = subAccountId ? `?subAccountId=${subAccountId}` : "";
    return this.client.get<Integration[]>(`/admin/integrations${params}`);
  }

  async getById(id: number): Promise<Integration> {
    return this.client.get<Integration>(`/admin/integrations/${id}`);
  }

  async getBySubAccount(subAccountId: number): Promise<Integration[]> {
    return this.client.get<Integration[]>(
      `/admin/integrations/subaccount/${subAccountId}`
    );
  }

  async getByStatus(
    status: string,
    subAccountId?: number
  ): Promise<Integration[]> {
    const params = subAccountId ? `?subAccountId=${subAccountId}` : "";
    return this.client.get<Integration[]>(
      `/admin/integrations/status/${status}${params}`
    );
  }

  async create(data: CreateIntegrationDto): Promise<Integration> {
    console.log("API: Creating integration with data:", data);
    const result = await this.client.post<Integration>(
      "/admin/integrations",
      data
    );
    console.log("API: Integration created successfully:", result);
    return result;
  }

  async update(id: number, data: UpdateIntegrationDto): Promise<Integration> {
    console.log("API: Updating integration with data:", { id, data });
    const result = await this.client.patch<Integration>(
      `/admin/integrations/${id}`,
      data
    );
    console.log("API: Integration updated successfully:", result);
    return result;
  }

  async updateStatus(
    id: number,
    status: string,
    errorMessage?: string
  ): Promise<Integration> {
    return this.client.patch<Integration>(`/admin/integrations/${id}/status`, {
      status,
      errorMessage,
    });
  }

  async testConnection(id: number): Promise<TestConnectionResponse> {
    return this.client.post<TestConnectionResponse>(
      `/admin/integrations/${id}/test`
    );
  }

  async syncData(id: number): Promise<SyncDataResponse> {
    return this.client.post<SyncDataResponse>(`/admin/integrations/${id}/sync`);
  }

  async deleteIntegration(id: number): Promise<void> {
    return this.client.delete<void>(`/admin/integrations/${id}`);
  }
}
