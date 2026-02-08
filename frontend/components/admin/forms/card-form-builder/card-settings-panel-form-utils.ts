import type {
  FlowchartNode,
  FlowchartNodeData,
} from "@/lib/forms/flowchart-types";
import type { FormField } from "@/lib/forms/types";
import { fieldTypeHasOptions } from "@/lib/forms/field-types";
import type {
  NodeSettingsFormValues,
  ConditionalLogicFormValues,
  JumpToRuleFormValues,
  DynamicLabelRuleFormValues,
} from "./card-settings-panel-form-types";
import { defaultMediaFormValues } from "./card-settings-panel-form-types";

const defaultConditionalLogic: ConditionalLogicFormValues = {
  jumpTo: [],
  dynamicLabel: [],
};

export function getDefaultFormValues(
  node: FlowchartNode
): NodeSettingsFormValues {
  const data = node.data ?? {};
  const isStatement = node.type === "statement";

  if (isStatement) {
    return {
      statementText: data.statementText || data.label || "",
      isSuccessCard: data.isSuccessCard ?? false,
      label: "",
      fieldType: "radio",
      required: false,
      placeholder: "",
      options: [],
      pipingKey: "",
      enablePiping: false,
      conditionalLogic: defaultConditionalLogic,
      media: data.media
        ? {
            ...defaultMediaFormValues,
            type: data.media.type,
            position: data.media.position,
            url: data.media.url ?? "",
            altText: data.media.altText ?? "",
            videoType: data.media.videoType ?? "youtube",
            videoId: data.media.videoId ?? "",
          }
        : null,
    };
  }

  const field = data.field;
  const jumpTo = data.field?.conditionalLogic?.jumpTo ?? [];
  const dynamicLabel = data.field?.conditionalLogic?.dynamicLabel ?? [];

  return {
    statementText: "",
    isSuccessCard: false,
    label: field?.label ?? data.label ?? "",
    fieldType: field?.type ?? data.fieldType ?? "radio",
    required: field?.required ?? false,
    placeholder: field?.placeholder ?? "",
    options: field?.options ?? [],
    optionDisplay: field?.optionDisplay,
    pipingKey: field?.pipingKey ?? "",
    enablePiping: field?.enablePiping ?? false,
    conditionalLogic: {
      showIf: field?.conditionalLogic?.showIf,
      hideIf: field?.conditionalLogic?.hideIf,
      jumpTo: jumpTo.map(
        (r): JumpToRuleFormValues => ({
          conditions: r.conditions,
          targetFieldId: r.targetFieldId,
        })
      ),
      dynamicLabel: dynamicLabel.map(
        (r): DynamicLabelRuleFormValues => ({
          conditions: r.conditions,
          label: r.label,
        })
      ),
    },
    media: data.media
      ? {
          ...defaultMediaFormValues,
          type: data.media.type,
          position: data.media.position,
          url: data.media.url ?? "",
          altText: data.media.altText ?? "",
          videoType: data.media.videoType ?? "youtube",
          videoId: data.media.videoId ?? "",
        }
      : null,
  };
}

export function formValuesToUpdates(
  values: NodeSettingsFormValues,
  node: FlowchartNode
): Partial<FlowchartNodeData> {
  const updates: Partial<FlowchartNodeData> = {};
  const isStatement = node.type === "statement";

  if (isStatement) {
    updates.statementText = values.statementText;
    updates.label = values.statementText;
    updates.isSuccessCard = values.isSuccessCard;
  } else {
    const fieldId = node.data?.fieldId ?? node.id;
    const field: FormField = {
      id: fieldId,
      type: values.fieldType as FormField["type"],
      label: values.label,
      required: values.required,
      placeholder: values.placeholder || undefined,
      options: fieldTypeHasOptions(values.fieldType as FormField["type"])
        ? (values.options ?? [])
        : undefined,
      optionDisplay: values.optionDisplay,
      pipingKey: values.pipingKey.trim() || undefined,
      enablePiping: values.enablePiping,
      conditionalLogic: {
        showIf: values.conditionalLogic.showIf,
        hideIf: values.conditionalLogic.hideIf,
        jumpTo:
          values.conditionalLogic.jumpTo.length > 0
            ? values.conditionalLogic.jumpTo
            : undefined,
        dynamicLabel:
          values.conditionalLogic.dynamicLabel.length > 0
            ? values.conditionalLogic.dynamicLabel
            : undefined,
      },
    };
    updates.field = field;
    updates.label = values.label;
    updates.fieldType = values.fieldType;
    updates.fieldId = field.id;
  }

  if (
    values.media &&
    (values.media.url ||
      (values.media.type === "video" && values.media.videoId))
  ) {
    updates.media = {
      type: values.media.type,
      position: values.media.position,
      url: values.media.url || undefined,
      altText: values.media.altText || undefined,
      videoType:
        values.media.type === "video" ? values.media.videoType : undefined,
      videoId:
        values.media.type === "video" && values.media.videoId
          ? values.media.videoId
          : undefined,
    };
  } else {
    updates.media = undefined;
  }

  return updates;
}
