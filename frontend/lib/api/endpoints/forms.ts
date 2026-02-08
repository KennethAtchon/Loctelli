import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { formsConfig } from "../config/forms.config";
import type {
  FormTemplate,
  FormSubmission,
  CreateFormTemplateDto,
  UpdateFormTemplateDto,
  CreateFormSubmissionDto,
  UpdateFormSubmissionDto,
  FormStats,
  UploadedFile,
  FormSessionPayload,
  CreateFormSessionDto,
  UpdateFormSessionDto,
} from "@/lib/forms/types";

export class FormsApi {
  private api: EndpointApi<typeof formsConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(formsConfig);
  }

  // Form Templates
  async getFormTemplates(subAccountId?: number): Promise<FormTemplate[]> {
    return this.api.getFormTemplates({ subAccountId }) as Promise<
      FormTemplate[]
    >;
  }

  async getFormTemplate(id: string): Promise<FormTemplate> {
    return this.api.getFormTemplate({ id }) as Promise<FormTemplate>;
  }

  async createFormTemplate(data: CreateFormTemplateDto): Promise<FormTemplate> {
    return this.api.createFormTemplate(
      undefined,
      data
    ) as Promise<FormTemplate>;
  }

  async updateFormTemplate(
    id: string,
    data: UpdateFormTemplateDto
  ): Promise<FormTemplate> {
    return this.api.updateFormTemplate({ id }, data) as Promise<FormTemplate>;
  }

  async deleteFormTemplate(id: string): Promise<void> {
    return this.api.deleteFormTemplate({ id }) as Promise<void>;
  }

  // Public form access
  async getPublicForm(slug: string): Promise<FormTemplate> {
    return this.api.getPublicForm({ slug }) as Promise<FormTemplate>;
  }

  async submitPublicForm(
    slug: string,
    data: CreateFormSubmissionDto
  ): Promise<FormSubmission> {
    return this.api.submitPublicForm({ slug }, data) as Promise<FormSubmission>;
  }

  async pingDatabase(): Promise<{
    status: string;
    timestamp: string;
  }> {
    return this.api.pingDatabase() as Promise<{
      status: string;
      timestamp: string;
    }>;
  }

  async uploadFormFile(
    slug: string,
    formData: FormData
  ): Promise<UploadedFile> {
    return this.api.uploadFormFile({ slug }, formData) as Promise<UploadedFile>;
  }

  async uploadAdminFile(
    slug: string,
    formData: FormData
  ): Promise<UploadedFile> {
    return this.api.uploadAdminFile(
      { slug },
      formData
    ) as Promise<UploadedFile>;
  }

  // Form session (card form save/resume)
  async createFormSession(
    slug: string,
    data?: CreateFormSessionDto
  ): Promise<FormSessionPayload> {
    return this.api.createFormSession(
      { slug },
      data ?? {}
    ) as Promise<FormSessionPayload>;
  }

  async getFormSession(
    slug: string,
    token: string
  ): Promise<FormSessionPayload> {
    return this.api.getFormSession({
      slug,
      token,
    }) as Promise<FormSessionPayload>;
  }

  async updateFormSession(
    slug: string,
    token: string,
    data: UpdateFormSessionDto
  ): Promise<FormSessionPayload> {
    return this.api.updateFormSession(
      { slug, token },
      data
    ) as Promise<FormSessionPayload>;
  }

  async completeFormSession(slug: string, token: string): Promise<void> {
    return this.api.completeFormSession({ slug, token }) as Promise<void>;
  }

  // Form Submissions
  async getFormSubmissions(
    subAccountId?: number,
    formTemplateId?: string,
    status?: string
  ): Promise<FormSubmission[]> {
    return this.api.getFormSubmissions({
      subAccountId,
      formTemplateId,
      status,
    }) as Promise<FormSubmission[]>;
  }

  async getFormSubmission(id: string): Promise<FormSubmission> {
    return this.api.getFormSubmission({
      id,
    }) as Promise<FormSubmission>;
  }

  async updateFormSubmission(
    id: string,
    data: UpdateFormSubmissionDto
  ): Promise<FormSubmission> {
    return this.api.updateFormSubmission(
      { id },
      data
    ) as Promise<FormSubmission>;
  }

  async deleteFormSubmission(id: string): Promise<void> {
    return this.api.deleteFormSubmission({ id }) as Promise<void>;
  }

  async getFormStats(): Promise<FormStats> {
    return this.api.getFormStats() as Promise<FormStats>;
  }

  // Profile estimation with AI
  async calculateProfileEstimation(
    slug: string,
    answers: Record<string, unknown>
  ): Promise<{
    type: string;
    result: Record<string, unknown>;
    aiEnhanced?: boolean;
    aiResult?: Record<string, unknown>;
    error?: string;
  }> {
    return this.api.calculateProfileEstimation(
      { slug },
      { answers }
    ) as Promise<{
      type: string;
      result: Record<string, unknown>;
      aiEnhanced?: boolean;
      aiResult?: Record<string, unknown>;
      error?: string;
    }>;
  }

  // Analytics
  async getFormAnalytics(formTemplateId: string): Promise<{
    totalViews: number;
    totalStarted: number;
    totalCompleted: number;
    completionRate: number;
    averageTime: number;
    dropOffAnalysis: Array<{
      cardIndex: number;
      cardId: string;
      cardLabel: string;
      views: number;
      dropOffRate: number;
      averageTime: number;
    }>;
    timePerCard: Record<string, number>;
    deviceBreakdown: {
      mobile: number;
      tablet: number;
      desktop: number;
      unknown: number;
    };
    profileResults?: Array<{
      result: string;
      count: number;
      percentage: number;
    }>;
  }> {
    return this.api.getFormAnalytics({ id: formTemplateId }) as Promise<{
      totalViews: number;
      totalStarted: number;
      totalCompleted: number;
      completionRate: number;
      averageTime: number;
      dropOffAnalysis: Array<{
        cardIndex: number;
        cardId: string;
        cardLabel: string;
        views: number;
        dropOffRate: number;
        averageTime: number;
      }>;
      timePerCard: Record<string, number>;
      deviceBreakdown: {
        mobile: number;
        tablet: number;
        desktop: number;
        unknown: number;
      };
      profileResults?: Array<{
        result: string;
        count: number;
        percentage: number;
      }>;
    }>;
  }

  async trackCardTime(
    slug: string,
    data: { sessionToken: string; cardId: string; timeSeconds: number }
  ): Promise<{ success: boolean }> {
    return this.api.trackCardTime({ slug }, data) as Promise<{
      success: boolean;
    }>;
  }

  /** Card Form AI chat: send message + current form context, get assistant reply. */
  async cardFormAiChat(body: {
    message: string;
    currentCardFormPayload?: Record<string, unknown>;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<{ content: string }> {
    return this.api.cardFormAiChat(undefined, body) as Promise<{
      content: string;
    }>;
  }
}
