import type { Condition, ConditionGroup, FormField } from "@/lib/api";

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
  if (hideIf && evaluateConditionGroup(hideIf, formData)) {
    return false;
  }

  // If showIf exists and is false, don't show
  if (showIf && !evaluateConditionGroup(showIf, formData)) {
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
    if (evaluateConditionGroup(jumpRule.conditions, formData)) {
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
    if (evaluateConditionGroup(dynamicLabelRule.conditions, formData)) {
      return dynamicLabelRule.label;
    }
  }

  return field.label;
}

/**
 * Replace piping syntax {{fieldId}} with actual values from form data
 */
export function applyPiping(
  text: string,
  formData: Record<string, unknown>,
  fields: FormField[]
): string {
  // Match {{fieldId}} or {{fieldId:fallback}} patterns
  const pipePattern = /\{\{([^}:]+)(?::([^}]+))?\}\}/g;

  return text.replace(pipePattern, (match, fieldId, fallback) => {
    const value = formData[fieldId];

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
