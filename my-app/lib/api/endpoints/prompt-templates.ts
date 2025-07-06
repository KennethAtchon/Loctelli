import { ApiClient } from '../client';

export interface PromptTemplate {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  systemPrompt: string;
  role: string;
  instructions?: string;
  context?: string;
  bookingInstruction?: string;
  creativity: number;
  temperature: number;
  maxTokens?: number;
  createdAt: string;
  updatedAt: string;
  createdByAdmin: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreatePromptTemplateDto {
  name: string;
  description?: string;
  isActive?: boolean;
  systemPrompt: string;
  role?: string;
  instructions?: string;
  context?: string;
  bookingInstruction?: string;
  creativity?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface UpdatePromptTemplateDto extends Partial<CreatePromptTemplateDto> {}

export class PromptTemplatesApi extends ApiClient {
  async getAll(): Promise<PromptTemplate[]> {
    return this.get<PromptTemplate[]>('/admin/prompt-templates');
  }

  async getById(id: number): Promise<PromptTemplate> {
    return this.get<PromptTemplate>(`/admin/prompt-templates/${id}`);
  }

  async getActive(): Promise<PromptTemplate> {
    return this.get<PromptTemplate>('/admin/prompt-templates/active');
  }

  async create(data: CreatePromptTemplateDto): Promise<PromptTemplate> {
    return this.post<PromptTemplate>('/admin/prompt-templates', data);
  }

  async update(id: number, data: UpdatePromptTemplateDto): Promise<PromptTemplate> {
    return this.patch<PromptTemplate>(`/admin/prompt-templates/${id}`, data);
  }

  async activate(id: number): Promise<PromptTemplate> {
    return this.patch<PromptTemplate>(`/admin/prompt-templates/${id}/activate`);
  }

  async deleteTemplate(id: number): Promise<void> {
    return this.delete<void>(`/admin/prompt-templates/${id}`);
  }
} 