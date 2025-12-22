import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { formsConfig } from "../config/forms.config";

// Form Template types
export interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "file"
    | "image";
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface FormTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  schema: FormField[];
  title: string;
  subtitle?: string;
  submitButtonText: string;
  successMessage: string;
  requiresWakeUp: boolean;
  wakeUpInterval: number;
  subAccountId?: number;
  createdAt: string;
  updatedAt: string;
  createdByAdminId: number;
  createdByAdmin?: {
    id: number;
    name: string;
    email: string;
  };
  subAccount?: {
    id: number;
    name: string;
  };
  _count?: {
    submissions: number;
  };
}

export interface FormSubmission {
  id: string;
  formTemplateId: string;
  data: Record<string, unknown>;
  files?: Record<string, UploadedFile>;
  ipAddress?: string;
  userAgent?: string;
  source: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedToId?: number;
  notes?: Array<{
    content: string;
    createdAt: string;
    authorId: number;
    authorName: string;
  }>;
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  contactedAt?: string;
  subAccountId: number;
  formTemplate?: {
    id: string;
    name: string;
    title: string;
    schema?: FormField[];
  };
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
  subAccount?: {
    id: number;
    name: string;
  };
}

export interface CreateFormTemplateDto {
  name: string;
  slug: string;
  description?: string;
  schema: FormField[];
  title: string;
  subtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  requiresWakeUp?: boolean;
  wakeUpInterval?: number;
  subAccountId?: number;
}

export interface UpdateFormTemplateDto {
  name?: string;
  slug?: string;
  description?: string;
  schema?: FormField[];
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  isActive?: boolean;
  requiresWakeUp?: boolean;
  wakeUpInterval?: number;
  subAccountId?: number;
}

export interface CreateFormSubmissionDto {
  formTemplateId?: string;
  data: Record<string, unknown>;
  files?: Record<string, UploadedFile>;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateFormSubmissionDto {
  status?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedToId?: number;
  notes?: Record<string, unknown>;
}

export interface FormStats {
  total: number;
  newCount: number;
  inProgress: number;
  completed: number;
}

export interface UploadedFile {
  url: string;
  originalName: string;
  fieldId?: string;
}

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

  async wakeUpDatabase(): Promise<{ status: string; timestamp: string }> {
    return this.api.wakeUpDatabase() as Promise<{
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
    return this.api.getFormSubmission({ id }) as Promise<FormSubmission>;
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
}
