/**
 * Form System Types - Single Source of Truth
 * 
 * All form-related types used across the application (API, flowchart, 
 * conditional logic, profile estimation) are defined here.
 * 
 * No duplicate type definitions should exist elsewhere.
 */

/** Shared media for card form fields */
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

export type FormFieldType =
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

export interface FormField {
  id: string;
  type: FormFieldType;
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
