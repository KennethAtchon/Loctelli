import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { promptTemplatesConfig } from "../config/prompt-templates.config";

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
  private api: EndpointApi<typeof promptTemplatesConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(promptTemplatesConfig);
  }

  async getAll(): Promise<PromptTemplate[]> {
    return this.api.getAll() as Promise<PromptTemplate[]>;
  }

  async getAllForSubAccount(subAccountId: number): Promise<PromptTemplate[]> {
    return this.api.getAllForSubAccount({ subAccountId }) as Promise<
      PromptTemplate[]
    >;
  }

  async getById(id: number): Promise<PromptTemplate> {
    return this.api.getById({ id }) as Promise<PromptTemplate>;
  }

  async getActive(): Promise<PromptTemplate> {
    return this.api.getActive() as Promise<PromptTemplate>;
  }

  async create(data: CreatePromptTemplateDto): Promise<PromptTemplate> {
    console.log("API: Creating prompt template with data:", data);
    const result = (await this.api.create(undefined, data)) as PromptTemplate;
    console.log("API: Prompt template created successfully:", result);
    return result;
  }

  async update(
    id: number,
    data: UpdatePromptTemplateDto
  ): Promise<PromptTemplate> {
    console.log("API: Updating prompt template with data:", { id, data });
    const result = (await this.api.update({ id }, data)) as PromptTemplate;
    console.log("API: Prompt template updated successfully:", result);
    return result;
  }

  async activate(id: number, subAccountId: number): Promise<PromptTemplate> {
    return this.api.activate(
      { id },
      { subAccountId }
    ) as Promise<PromptTemplate>;
  }

  async deleteTemplate(id: number): Promise<void> {
    return this.api.deleteTemplate({ id }) as Promise<void>;
  }
}
