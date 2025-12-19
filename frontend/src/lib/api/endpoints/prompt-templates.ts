import { ApiClient } from "../client";

export interface PromptTemplate {
  id: number;
  name: string;
  description?: string;
  category?: string;

  // The Minimal Base
  baseSystemPrompt: string;

  // OpenAI Defaults
  temperature?: number;
  maxTokens?: number;

  // Metadata
  isActive: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdByAdmin: {
    id: number;
    name: string;
    email: string;
  };
  strategyCount?: number;
  isActiveForSubAccount?: boolean;
}

export interface CreatePromptTemplateDto {
  name: string;
  description?: string;
  category?: string;

  // The Minimal Base
  baseSystemPrompt: string;

  // OpenAI Defaults
  temperature?: number;
  maxTokens?: number;

  // Metadata
  isActive?: boolean;
  tags?: string[];
}

export type UpdatePromptTemplateDto = Partial<CreatePromptTemplateDto>;

export class PromptTemplatesApi {
  constructor(private client: ApiClient) {}

  async getAll(): Promise<PromptTemplate[]> {
    return this.client.get<PromptTemplate[]>("/admin/prompt-templates");
  }

  async getAllForSubAccount(subAccountId: number): Promise<PromptTemplate[]> {
    return this.client.get<PromptTemplate[]>(
      `/admin/prompt-templates/subaccount/${subAccountId}`,
    );
  }

  async getById(id: number): Promise<PromptTemplate> {
    return this.client.get<PromptTemplate>(`/admin/prompt-templates/${id}`);
  }

  async getActive(): Promise<PromptTemplate> {
    return this.client.get<PromptTemplate>("/admin/prompt-templates/active");
  }

  async create(data: CreatePromptTemplateDto): Promise<PromptTemplate> {
    console.log("API: Creating prompt template with data:", data);
    const result = await this.client.post<PromptTemplate>(
      "/admin/prompt-templates",
      data,
    );
    console.log("API: Prompt template created successfully:", result);
    return result;
  }

  async update(
    id: number,
    data: UpdatePromptTemplateDto,
  ): Promise<PromptTemplate> {
    console.log("API: Updating prompt template with data:", { id, data });
    const result = await this.client.patch<PromptTemplate>(
      `/admin/prompt-templates/${id}`,
      data,
    );
    console.log("API: Prompt template updated successfully:", result);
    return result;
  }

  async activate(id: number, subAccountId: number): Promise<PromptTemplate> {
    return this.client.patch<PromptTemplate>(
      `/admin/prompt-templates/${id}/activate`,
      { subAccountId },
    );
  }

  async deleteTemplate(id: number): Promise<void> {
    return this.client.delete<void>(`/admin/prompt-templates/${id}`);
  }
}
