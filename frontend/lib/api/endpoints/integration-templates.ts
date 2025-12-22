import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { integrationTemplatesConfig } from "../config/integration-templates.config";

export interface ConfigSchema {
  properties?: Record<
    string,
    {
      type: string;
      title?: string;
      description?: string;
    }
  >;
  required?: string[];
}

export interface IntegrationTemplate {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  icon?: string;
  isActive: boolean;
  configSchema: ConfigSchema;
  setupInstructions?: string;
  webhookUrl?: string;
  apiVersion?: string;
  createdAt: string;
  updatedAt: string;
  createdByAdmin: {
    id: number;
    name: string;
    email: string;
  };
  integrationCount?: number;
}

export interface CreateIntegrationTemplateDto {
  name: string;
  displayName: string;
  description?: string;
  category: string;
  icon?: string;
  isActive?: boolean;
  configSchema: ConfigSchema;
  setupInstructions?: string;
  webhookUrl?: string;
  apiVersion?: string;
}

export type UpdateIntegrationTemplateDto =
  Partial<CreateIntegrationTemplateDto>;

export class IntegrationTemplatesApi {
  private api: EndpointApi<typeof integrationTemplatesConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(integrationTemplatesConfig);
  }

  async getAll(): Promise<IntegrationTemplate[]> {
    return this.api.getAll() as Promise<IntegrationTemplate[]>;
  }

  async getById(id: number): Promise<IntegrationTemplate> {
    return this.api.getById({ id }) as Promise<IntegrationTemplate>;
  }

  async getActive(): Promise<IntegrationTemplate[]> {
    return this.api.getActive() as Promise<IntegrationTemplate[]>;
  }

  async getByCategory(category: string): Promise<IntegrationTemplate[]> {
    return this.api.getByCategory({ category }) as Promise<IntegrationTemplate[]>;
  }

  async create(
    data: CreateIntegrationTemplateDto
  ): Promise<IntegrationTemplate> {
    console.log("API: Creating integration template with data:", data);
    const result = await this.api.create(undefined, data) as IntegrationTemplate;
    console.log("API: Integration template created successfully:", result);
    return result;
  }

  async update(
    id: number,
    data: UpdateIntegrationTemplateDto
  ): Promise<IntegrationTemplate> {
    console.log("API: Updating integration template with data:", { id, data });
    const result = await this.api.update({ id }, data) as IntegrationTemplate;
    console.log("API: Integration template updated successfully:", result);
    return result;
  }

  async deleteTemplate(id: number): Promise<void> {
    return this.api.deleteTemplate({ id }) as Promise<void>;
  }
}
