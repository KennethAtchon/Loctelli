import { ApiClient } from '../client';

export interface ConfigSchema {
  properties?: Record<string, {
    type: string;
    title?: string;
    description?: string;
  }>;
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

export type UpdateIntegrationTemplateDto = Partial<CreateIntegrationTemplateDto>;

export class IntegrationTemplatesApi extends ApiClient {
  async getAll(): Promise<IntegrationTemplate[]> {
    return this.get<IntegrationTemplate[]>('/admin/integration-templates');
  }

  async getById(id: number): Promise<IntegrationTemplate> {
    return this.get<IntegrationTemplate>(`/admin/integration-templates/${id}`);
  }

  async getActive(): Promise<IntegrationTemplate[]> {
    return this.get<IntegrationTemplate[]>('/admin/integration-templates/active');
  }

  async getByCategory(category: string): Promise<IntegrationTemplate[]> {
    return this.get<IntegrationTemplate[]>(`/admin/integration-templates/category/${category}`);
  }

  async create(data: CreateIntegrationTemplateDto): Promise<IntegrationTemplate> {
    console.log('API: Creating integration template with data:', data);
    const result = await this.post<IntegrationTemplate>('/admin/integration-templates', data);
    console.log('API: Integration template created successfully:', result);
    return result;
  }

  async update(id: number, data: UpdateIntegrationTemplateDto): Promise<IntegrationTemplate> {
    console.log('API: Updating integration template with data:', { id, data });
    const result = await this.patch<IntegrationTemplate>(`/admin/integration-templates/${id}`, data);
    console.log('API: Integration template updated successfully:', result);
    return result;
  }

  async deleteTemplate(id: number): Promise<void> {
    return this.delete<void>(`/admin/integration-templates/${id}`);
  }
} 