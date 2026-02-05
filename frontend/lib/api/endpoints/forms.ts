import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { formsConfig } from "../config/forms.config";

// Form Template types
export interface CardMedia {
  type: "image" | "video" | "gif" | "icon";
  url?: string;
  altText?: string;
  position: "above" | "below" | "background" | "left" | "right";
  videoType?: "youtube" | "vimeo" | "upload";
  videoId?: string;
}

/** Condition operator types */
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "starts_with"
  | "ends_with";

/** Single condition */
export interface Condition {
  fieldId: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

/** Condition group (AND/OR logic) */
export interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: Condition[];
}

/** Conditional logic for a field */
export interface ConditionalLogic {
  /** Show this field if conditions match */
  showIf?: ConditionGroup;
  /** Hide this field if conditions match */
  hideIf?: ConditionGroup;
  /** Jump to specific card based on conditions */
  jumpTo?: {
    conditions: ConditionGroup;
    targetFieldId: string;
  }[];
  /** Dynamic label based on conditions */
  dynamicLabel?: {
    conditions: ConditionGroup;
    label: string;
  }[];
}

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
    | "image"
    | "statement";
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  /** Media for card forms */
  media?: CardMedia;
  /** Conditional logic (show/hide/jump) */
  conditionalLogic?: ConditionalLogic;
  /** Enable piping (insert previous answers into labels using {{fieldId}}) */
  enablePiping?: boolean;
}

/** Scoring rule for profile estimation */
export interface ScoringRule {
  fieldId: string;
  operator: "equals" | "contains" | "greater_than" | "less_than";
  value: string | number | boolean | string[];
  weight?: number;
}

/** Field scoring configuration */
export interface FieldScoring {
  fieldId: string;
  scoring: {
    answer: string | number | boolean | string[];
    points: number;
    dimension?: string; // For multi-dimension
  }[];
}

/** AI Profile Configuration (optional) */
export interface AIProfileConfig {
  enabled: boolean; // Default: false (rule-based scoring)
  model?: "gpt-4" | "claude" | "custom";
  prompt?: string;
  analysisType?: "sentiment" | "personality" | "recommendation";
  outputFormat?: "percentage" | "category" | "freeform";
}

/** Profile Estimation Configuration */
export interface ProfileEstimation {
  enabled: boolean;
  type: "percentage" | "category" | "multi_dimension" | "recommendation";

  /** AI Enhancement (optional - defaults to rule-based scoring) */
  aiConfig?: AIProfileConfig;

  /** For percentage type */
  percentageConfig?: {
    title: string;
    description: string;
    /** Field scoring configuration for calculating percentage */
    fieldScoring?: FieldScoring[];
    ranges: {
      min: number;
      max: number;
      label: string;
      description: string;
      image?: string;
    }[];
  };

  /** For category type */
  categoryConfig?: {
    title: string;
    categories: {
      id: string;
      name: string;
      description: string;
      image?: string;
      matchingLogic: ScoringRule[];
    }[];
  };

  /** For multi-dimension type */
  dimensionConfig?: {
    title: string;
    dimensions: {
      id: string;
      name: string;
      maxScore: number;
      fields: FieldScoring[];
    }[];
    visualization: "bars" | "radar" | "pie";
  };

  /** For recommendation type */
  recommendationConfig?: {
    title: string;
    recommendations: {
      id: string;
      name: string;
      description: string;
      image?: string;
      matchingCriteria: ScoringRule[];
    }[];
  };
}

export type FormType = "SIMPLE" | "CARD";

export interface FormTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  formType: FormType;
  schema: FormField[];
  title: string;
  subtitle?: string;
  submitButtonText: string;
  successMessage: string;
  cardSettings?: Record<string, unknown>;
  profileEstimation?: ProfileEstimation;
  styling?: Record<string, unknown>;
  analyticsEnabled?: boolean;
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
  formType?: FormType;
  schema: FormField[];
  title: string;
  subtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  cardSettings?: Record<string, unknown>;
  profileEstimation?: ProfileEstimation;
  styling?: Record<string, unknown>;
  analyticsEnabled?: boolean;
  requiresWakeUp?: boolean;
  wakeUpInterval?: number;
  subAccountId?: number;
}

export interface UpdateFormTemplateDto {
  name?: string;
  slug?: string;
  description?: string;
  formType?: FormType;
  schema?: FormField[];
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  cardSettings?: Record<string, unknown>;
  profileEstimation?: ProfileEstimation;
  styling?: Record<string, unknown>;
  analyticsEnabled?: boolean;
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

export interface FormSessionPayload {
  sessionToken: string;
  currentCardIndex: number;
  partialData: Record<string, unknown>;
  formTemplateId: string;
}

export interface CreateFormSessionDto {
  deviceType?: string;
  browser?: string;
  os?: string;
}

export interface UpdateFormSessionDto {
  currentCardIndex?: number;
  partialData?: Record<string, unknown>;
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

  async wakeUpDatabase(): Promise<{
    status: string;
    timestamp: string;
  }> {
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

  async uploadAdminFile(
    slug: string,
    formData: FormData
  ): Promise<UploadedFile> {
    return this.api.uploadAdminFile({ slug }, formData) as Promise<UploadedFile>;
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
}
