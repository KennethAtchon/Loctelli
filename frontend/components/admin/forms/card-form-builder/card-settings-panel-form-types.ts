/**
 * React Hook Form values for the card settings panel (single node edit).
 * Covers both statement and question node data + media.
 */
import type {
  ConditionGroup,
  ConditionBlock,
  FormFieldOption,
  OptionDisplay,
} from "@/lib/forms/types";

export interface NodeSettingsFormValues {
  // Statement
  statementText: string;
  isSuccessCard: boolean;
  // Question
  label: string;
  fieldType: string;
  required: boolean;
  placeholder: string;
  options: FormFieldOption[];
  optionDisplay?: OptionDisplay;
  pipingKey: string;
  enablePiping: boolean;
  conditionalLogic: ConditionalLogicFormValues;
  // Media (shared)
  media: MediaFormValues | null;
}

export interface ConditionalLogicFormValues {
  showIf?: ConditionGroup | ConditionBlock;
  hideIf?: ConditionGroup | ConditionBlock;
  jumpTo: JumpToRuleFormValues[];
  dynamicLabel: DynamicLabelRuleFormValues[];
}

export interface JumpToRuleFormValues {
  conditions: ConditionGroup | ConditionBlock;
  targetFieldId: string;
}

export interface DynamicLabelRuleFormValues {
  conditions: ConditionGroup | ConditionBlock;
  label: string;
}

export interface MediaFormValues {
  type: "image" | "video" | "gif" | "icon";
  position: "above" | "below" | "background" | "left" | "right";
  url: string;
  altText: string;
  videoType: "youtube" | "vimeo" | "upload";
  videoId: string;
}

export const defaultMediaFormValues: MediaFormValues = {
  type: "image",
  position: "above",
  url: "",
  altText: "",
  videoType: "youtube",
  videoId: "",
};
