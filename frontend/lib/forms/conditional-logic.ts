import type {
  Condition,
  ConditionBlock,
  ConditionGroup,
  FormField,
} from "./types";

/**
 * Evaluate a single condition against form data
 */
export function evaluateCondition(
  condition: Condition,
  formData: Record<string, unknown>
): boolean {
  const fieldValue = formData[condition.fieldId];
  const conditionValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return String(fieldValue) === String(conditionValue);
    case "not_equals":
      return String(fieldValue) !== String(conditionValue);
    case "contains":
      return String(fieldValue)
        .toLowerCase()
        .includes(String(conditionValue).toLowerCase());
    case "not_contains":
      return !String(fieldValue)
        .toLowerCase()
        .includes(String(conditionValue).toLowerCase());
    case "greater_than":
      return Number(fieldValue) > Number(conditionValue);
    case "less_than":
      return Number(fieldValue) < Number(conditionValue);
    case "is_empty":
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    case "is_not_empty":
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== "" &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    case "starts_with":
      return String(fieldValue)
        .toLowerCase()
        .startsWith(String(conditionValue).toLowerCase());
    case "ends_with":
      return String(fieldValue)
        .toLowerCase()
        .endsWith(String(conditionValue).toLowerCase());
    default:
      return false;
  }
}

/**
 * Evaluate a condition group (AND/OR logic)
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  formData: Record<string, unknown>
): boolean {
  if (group.conditions.length === 0) return true;

  if (group.operator === "AND") {
    return group.conditions.every((condition) =>
      evaluateCondition(condition, formData)
    );
  } else {
    // OR
    return group.conditions.some((condition) =>
      evaluateCondition(condition, formData)
    );
  }
}

function isConditionBlock(
  block: ConditionGroup | ConditionBlock
): block is ConditionBlock {
  return "groups" in block && Array.isArray((block as ConditionBlock).groups);
}

/**
 * Get a flat list of conditions from a ConditionGroup or ConditionBlock.
 * For a block, flattens all groups' conditions (order preserved).
 */
export function getConditionsFromGroupOrBlock(
  block: ConditionGroup | ConditionBlock | undefined
): Condition[] {
  if (!block) return [];
  if (isConditionBlock(block)) {
    return block.groups.flatMap((g) => g.conditions);
  }
  return block.conditions;
}

/**
 * Evaluate a condition block: either a single ConditionGroup or a ConditionBlock (group of groups).
 * Enables "(A and B) OR (C and D)" style logic.
 */
export function evaluateConditionBlock(
  block: ConditionGroup | ConditionBlock,
  formData: Record<string, unknown>
): boolean {
  if (isConditionBlock(block)) {
    if (block.groups.length === 0) return true;
    const results = block.groups.map((g) =>
      evaluateConditionGroup(g, formData)
    );
    return block.operator === "AND"
      ? results.every(Boolean)
      : results.some(Boolean);
  }
  return evaluateConditionGroup(block, formData);
}

/**
 * Check if a field should be shown based on conditional logic
 */
export function shouldShowField(
  field: FormField,
  formData: Record<string, unknown>
): boolean {
  if (!field.conditionalLogic) return true;

  const { showIf, hideIf } = field.conditionalLogic;

  // If hideIf is true, don't show
  if (hideIf && evaluateConditionBlock(hideIf, formData)) {
    return false;
  }

  // If showIf exists and is false, don't show
  if (showIf && !evaluateConditionBlock(showIf, formData)) {
    return false;
  }

  return true;
}

/**
 * Find the target field ID to jump to based on conditional logic
 * Returns the first matching jumpTo target, or null if no match
 */
export function getJumpTarget(
  field: FormField,
  formData: Record<string, unknown>
): string | null {
  if (!field.conditionalLogic?.jumpTo) return null;

  for (const jumpRule of field.conditionalLogic.jumpTo) {
    if (evaluateConditionBlock(jumpRule.conditions, formData)) {
      return jumpRule.targetFieldId;
    }
  }

  return null;
}

/**
 * Get dynamic label based on conditional logic
 * Returns the first matching dynamic label, or the original label
 */
export function getDynamicLabel(
  field: FormField,
  formData: Record<string, unknown>
): string {
  if (!field.conditionalLogic?.dynamicLabel) return field.label;

  for (const dynamicLabelRule of field.conditionalLogic.dynamicLabel) {
    if (evaluateConditionBlock(dynamicLabelRule.conditions, formData)) {
      return dynamicLabelRule.label;
    }
  }

  return field.label;
}

/**
 * Resolve a piping token ({{token}}) to a field: match by pipingKey or id.
 * formData is keyed by field.id, so we need the field to look up the value.
 */
export function resolveFieldByPipingToken(
  token: string,
  fields: FormField[]
): FormField | undefined {
  const byPipingKey = fields.find((f) => f.pipingKey && f.pipingKey === token);
  if (byPipingKey) return byPipingKey;
  return fields.find((f) => f.id === token);
}

/**
 * Display name for piping: use pipingKey if set, else id (for "Use {{name}}" in UI).
 */
export function getPipingDisplayToken(field: FormField): string {
  return field.pipingKey && field.pipingKey.trim() !== ""
    ? field.pipingKey.trim()
    : field.id;
}

/**
 * Information about a piping reference
 */
export interface PipingInfo {
  fieldId: string;
  /** Token used in text (may be pipingKey or id) */
  token: string;
  fallback?: string;
  exists: boolean;
  value: unknown;
  resolved: string;
  fieldLabel?: string;
}

/**
 * Extract all piping references from text
 */
export function extractPipingReferences(
  text: string,
  formData: Record<string, unknown>,
  fields: FormField[]
): PipingInfo[] {
  const pipePattern = /\{\{([^}:]+)(?::([^}]+))?\}\}/g;
  const references: PipingInfo[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = pipePattern.exec(text)) !== null) {
    const [, token, fallback] = match;
    const key = `${token}:${fallback || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const field = resolveFieldByPipingToken(token, fields);
    const value = field ? formData[field.id] : undefined;
    let resolved: string;

    if (Array.isArray(value)) {
      resolved = value.length > 0 ? value.join(", ") : fallback || "";
    } else if (value === undefined || value === null || value === "") {
      resolved = fallback || "";
    } else {
      resolved = String(value);
    }

    references.push({
      fieldId: field?.id ?? token,
      token,
      fallback,
      exists: field !== undefined,
      value,
      resolved,
      fieldLabel: field?.label,
    });
  }

  return references;
}

/**
 * Replace piping syntax {{token}} with actual values from form data.
 * Token is resolved by pipingKey first, then by field id.
 */
export function applyPiping(
  text: string,
  formData: Record<string, unknown>,
  fields: FormField[],
  options?: { debug?: boolean }
): string {
  // Match {{token}} or {{token:fallback}} patterns
  const pipePattern = /\{\{([^}:]+)(?::([^}]+))?\}\}/g;

  return text.replace(pipePattern, (match, token, fallback) => {
    const field = resolveFieldByPipingToken(token, fields);
    const value = field ? formData[field.id] : undefined;

    // Warn in dev mode if no field found
    if (options?.debug && !field) {
      const available = fields.map((f) => getPipingDisplayToken(f));
      console.warn(`[Piping] "${token}" not found. Available:`, available);
    }

    // Handle array values (e.g., checkbox selections)
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : fallback || "";
    }

    // Handle empty/null values
    if (value === undefined || value === null || value === "") {
      return fallback || "";
    }

    return String(value);
  });
}

/**
 * Get the next card index based on conditional logic and current answers
 * Returns the index of the target field in the visible fields array, or next sequential index if no jump
 */
export function getNextCardIndex(
  currentIndex: number,
  visibleFields: FormField[],
  formData: Record<string, unknown>
): number {
  const currentField = visibleFields[currentIndex];
  if (!currentField) return currentIndex + 1;

  const jumpTarget = getJumpTarget(currentField, formData);
  if (jumpTarget) {
    const targetIndex = visibleFields.findIndex((f) => f.id === jumpTarget);
    if (targetIndex !== -1) {
      return targetIndex;
    }
  }

  return currentIndex + 1;
}

/**
 * Filter fields based on show/hide logic
 * Returns only fields that should be visible given current form data
 */
export function getVisibleFields(
  fields: FormField[],
  formData: Record<string, unknown>
): FormField[] {
  return fields.filter((field) => shouldShowField(field, formData));
}
