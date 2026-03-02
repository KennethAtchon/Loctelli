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

/**
 * Top-level "group of groups": (group1) AND/OR (group2).
 * Enables "(A and B) OR (C and D)" style logic.
 */
export interface ConditionBlock {
  operator: "AND" | "OR";
  groups: ConditionGroup[];
}

/** Conditional logic for a field */
export interface ConditionalLogic {
  /** Show this field if conditions match */
  showIf?: ConditionGroup | ConditionBlock;
  /** Hide this field if conditions match */
  hideIf?: ConditionGroup | ConditionBlock;
  /** Jump to specific card based on conditions */
  jumpTo?: {
    conditions: ConditionGroup | ConditionBlock;
    targetFieldId: string;
  }[];
  /** Dynamic label based on conditions */
  dynamicLabel?: {
    conditions: ConditionGroup | ConditionBlock;
    label: string;
  }[];
}

export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "file"
  | "image"
  | "statement";

/**
 * Option for select/radio/checkbox. Text mode: string (label = value).
 * Image mode: { value, imageUrl, altText? }. No mixing within one field.
 */
export type FormFieldOption =
  | string
  | { value: string; imageUrl: string; altText?: string };

/** How options are displayed: text labels or images. Omitted = 'text'. */
export type OptionDisplay = "text" | "image";

/** Form field used in both SIMPLE and CARD forms. Card-specific: media, conditionalLogic, enablePiping. */
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  /** Text mode: string[]. Image mode: { value, imageUrl, altText? }[]. No mix. */
  options?: FormFieldOption[];
  /** When 'image', options must be image-option objects. Omitted or 'text' = text options. */
  optionDisplay?: OptionDisplay;
  required?: boolean;
  /** Media for card forms */
  media?: CardMedia;
  /** Conditional logic (show/hide/jump) */
  conditionalLogic?: ConditionalLogic;
  /** Enable piping (insert previous answers into labels using {{fieldId}}) */
  enablePiping?: boolean;
  /**
   * Human-readable variable name for piping, e.g. "name" → use {{name}} in later questions.
   * If not set, {{id}} is used (id is the internal node id).
   */
  pipingKey?: string;
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

/** Card form theme / UI builder settings. All optional; missing = use app default. */
export interface FormStyling {
  fontFamily?: {
    heading?: string;
    body?: string;
  };
  baseFontSize?: number;
  colors?: {
    primary?: string;
    primaryForeground?: string;
    accent?: string;
    background?: string;
    foreground?: string;
    card?: string;
    cardForeground?: string;
    border?: string;
    muted?: string;
    mutedForeground?: string;
  };
  card?: {
    borderRadius?: number | string;
    shadow?: "none" | "sm" | "md" | "lg";
    padding?: number | string;
    /** Max width of the card container (e.g. 480, "28rem", "36rem", "100%"). */
    maxWidth?: number | string;
    /** Height configuration for card forms */
    height?: {
      mobile?: string | number; // e.g. "400px", "24rem", 400
      tablet?: string | number; // e.g. "600px", "36rem", 600
      desktop?: string | number; // e.g. "800px", "48rem", 800
    };
  };
  buttons?: {
    borderRadius?: number | string;
    style?: "solid" | "outline" | "ghost";
  };
  progress?: {
    style?: "bar" | "dots" | "numbers";
    barHeight?: number;
    color?: string;
  };
  resultScreen?: {
    layout?: "centered" | "full";
    titleFontSize?: number | string;
  };
}

/**
 * schema vs flowchartGraph (CARD forms only):
 *
 * - schema: Linear FormField[] in display order. Runtime source of truth for the
 *   public form (which card to show, validation). For CARD forms it is derived from
 *   the flowchart on save (flowchartToSchema) and stored on the template.
 *
 * - flowchartGraph: Stored under cardSettings.flowchartGraph. We keep it because
 *   schema alone cannot be turned back into the builder graph: schema is a flat
 *   list and does not contain (1) node positions (x, y) or viewport (pan/zoom),
 *   (2) which edges connect which nodes when there are branches, or (3) per-edge
 *   condition labels. The graph is the editor's source of truth; we derive schema
 *   from it for runtime and persist both.
 */
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
  styling?: FormStyling | null;
  analyticsEnabled?: boolean;
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
  styling?: FormStyling | null;
  analyticsEnabled?: boolean;
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
  styling?: FormStyling | null;
  analyticsEnabled?: boolean;
  isActive?: boolean;
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
