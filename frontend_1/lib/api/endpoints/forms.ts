import { ApiClient } from "../client";

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
  data: Record<string, any>;
  files?: Record<string, any>;
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
  formTemplateId: string;
  data: Record<string, any>;
  files?: Record<string, any>;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateFormSubmissionDto {
  status?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedToId?: number;
  notes?: Record<string, any>;
}

export interface FormStats {
  total: number;
  newCount: number;
  inProgress: number;
  completed: number;
}

export class FormsApi {
  constructor(private client: ApiClient) {}

  // Form Templates
  async getFormTemplates(subAccountId?: number): Promise<FormTemplate[]> {
    const queryParams = new URLSearchParams();
    if (subAccountId) {
      queryParams.append("subAccountId", subAccountId.toString());
    }
    const queryString = queryParams.toString();
    return this.client.get<FormTemplate[]>(
      `/forms/templates${queryString ? `?${queryString}` : ""}`
    );
  }

  async getFormTemplate(id: string): Promise<FormTemplate> {
    return this.client.get<FormTemplate>(`/forms/templates/${id}`);
  }

  async createFormTemplate(data: CreateFormTemplateDto): Promise<FormTemplate> {
    return this.client.post<FormTemplate>("/forms/templates", data);
  }

  async updateFormTemplate(
    id: string,
    data: UpdateFormTemplateDto
  ): Promise<FormTemplate> {
    return this.client.patch<FormTemplate>(`/forms/templates/${id}`, data);
  }

  async deleteFormTemplate(id: string): Promise<void> {
    return this.client.delete(`/forms/templates/${id}`);
  }

  // Public form access
  async getPublicForm(slug: string): Promise<FormTemplate> {
    return this.client.get<FormTemplate>(`/forms/public/${slug}`);
  }

  async submitPublicForm(slug: string, data: any): Promise<FormSubmission> {
    return this.client.post<FormSubmission>(
      `/forms/public/${slug}/submit`,
      data
    );
  }

  async wakeUpDatabase(): Promise<{ status: string; timestamp: string }> {
    return this.client.get<{ status: string; timestamp: string }>(
      "/forms/public/wake-up"
    );
  }

  async uploadFormFile(slug: string, formData: FormData): Promise<any> {
    return this.client.uploadFile<any>(
      `/forms/public/${slug}/upload`,
      formData
    );
  }

  // Form Submissions
  async getFormSubmissions(
    subAccountId?: number,
    formTemplateId?: string,
    status?: string
  ): Promise<FormSubmission[]> {
    const queryParams = new URLSearchParams();
    if (subAccountId) {
      queryParams.append("subAccountId", subAccountId.toString());
    }
    if (formTemplateId) {
      queryParams.append("formTemplateId", formTemplateId);
    }
    if (status) {
      queryParams.append("status", status);
    }
    const queryString = queryParams.toString();
    return this.client.get<FormSubmission[]>(
      `/forms/submissions${queryString ? `?${queryString}` : ""}`
    );
  }

  async getFormSubmission(id: string): Promise<FormSubmission> {
    return this.client.get<FormSubmission>(`/forms/submissions/${id}`);
  }

  async updateFormSubmission(
    id: string,
    data: UpdateFormSubmissionDto
  ): Promise<FormSubmission> {
    return this.client.patch<FormSubmission>(`/forms/submissions/${id}`, data);
  }

  async deleteFormSubmission(id: string): Promise<void> {
    return this.client.delete(`/forms/submissions/${id}`);
  }

  async getFormStats(): Promise<FormStats> {
    return this.client.get<FormStats>("/forms/submissions/stats");
  }
}
