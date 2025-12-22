import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { integrationsConfig } from "../config/integrations.config";

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
  private api: EndpointApi<typeof integrationsConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(integrationsConfig);
  }

  async getAll(subAccountId?: number): Promise<Integration[]> {
    return this.api.getAll({ subAccountId }) as Promise<Integration[]>;
  }

  async getById(id: number): Promise<Integration> {
    return this.api.getById({ id }) as Promise<Integration>;
  }

  async getBySubAccount(subAccountId: number): Promise<Integration[]> {
    return this.api.getBySubAccount({ subAccountId }) as Promise<Integration[]>;
  }

  async getByStatus(
    status: string,
    subAccountId?: number
  ): Promise<Integration[]> {
    return this.api.getByStatus({ status, subAccountId }) as Promise<
      Integration[]
    >;
  }

  async create(data: CreateIntegrationDto): Promise<Integration> {
    console.log("API: Creating integration with data:", data);
    const result = (await this.api.create(undefined, data)) as Integration;
    console.log("API: Integration created successfully:", result);
    return result;
  }

  async update(id: number, data: UpdateIntegrationDto): Promise<Integration> {
    console.log("API: Updating integration with data:", { id, data });
    const result = (await this.api.update({ id }, data)) as Integration;
    console.log("API: Integration updated successfully:", result);
    return result;
  }

  async updateStatus(
    id: number,
    status: string,
    errorMessage?: string
  ): Promise<Integration> {
    return this.api.updateStatus(
      { id },
      { status, errorMessage }
    ) as Promise<Integration>;
  }

  async testConnection(id: number): Promise<TestConnectionResponse> {
    return this.api.testConnection({ id }) as Promise<TestConnectionResponse>;
  }

  async syncData(id: number): Promise<SyncDataResponse> {
    return this.api.syncData({ id }) as Promise<SyncDataResponse>;
  }

  async deleteIntegration(id: number): Promise<void> {
    return this.api.deleteIntegration({ id }) as Promise<void>;
  }
}
