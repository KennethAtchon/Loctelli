import { useMemo, useCallback } from "react";
import type { FormField } from "@/lib/forms/types";
import {
  getVisibleFields,
  getNextCardIndex,
  getJumpTarget,
} from "@/lib/forms/conditional-logic";
import { clampToVisible } from "@/lib/forms/navigation";

/**
 * Hook to manage navigation state (visible fields, current field, navigation actions).
 * Pure derivation - no state, no effects.
 */
export function useCardFormNavigation(
  schema: FormField[],
  formData: Record<string, unknown>,
  currentIndex: number,
  setCurrentIndex: (index: number | ((prev: number) => number)) => void
): {
  visibleFields: FormField[];
  currentField: FormField | undefined;
  currentVisibleIndex: number;
  isFirst: boolean;
  isLast: boolean;
  goNext: () => void;
  goBack: () => void;
} {
  // Derive visible fields from schema and form data
  const visibleFields = useMemo(
    () => getVisibleFields(schema, formData),
    [schema, formData]
  );

  // Clamp current index to visible fields (forward bias)
  const currentVisibleIndex = useMemo(() => {
    return clampToVisible(schema, visibleFields, currentIndex);
  }, [schema, visibleFields, currentIndex]);

  // Current field from visible fields
  const currentField = visibleFields[currentVisibleIndex];

  // Navigation flags
  const isFirst = currentVisibleIndex === 0;
  const isLast = currentVisibleIndex === visibleFields.length - 1;

  // Navigate to next card
  const goNext = useCallback(() => {
    if (isLast) return;

    const nextVisibleIndex = getNextCardIndex(
      currentVisibleIndex,
      visibleFields,
      formData
    );

    if (nextVisibleIndex >= 0 && nextVisibleIndex < visibleFields.length) {
      // Find the schema index for the next visible field
      const nextField = visibleFields[nextVisibleIndex];
      const schemaIndex = schema.findIndex((f) => f.id === nextField.id);
      if (schemaIndex >= 0) {
        setCurrentIndex(schemaIndex);
      } else {
        // Fallback: increment current index
        setCurrentIndex((prev) => prev + 1);
      }
    } else if (nextVisibleIndex === -1) {
      // At end, but isLast should have caught this
      return;
    }
  }, [
    isLast,
    currentVisibleIndex,
    visibleFields,
    formData,
    schema,
    setCurrentIndex,
  ]);

  // Navigate to previous card
  const goBack = useCallback(() => {
    if (isFirst) return;

    const prevVisibleIndex = currentVisibleIndex - 1;
    if (prevVisibleIndex >= 0) {
      const prevField = visibleFields[prevVisibleIndex];
      const schemaIndex = schema.findIndex((f) => f.id === prevField.id);
      if (schemaIndex >= 0) {
        setCurrentIndex(schemaIndex);
      } else {
        // Fallback: decrement current index
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    }
  }, [isFirst, currentVisibleIndex, visibleFields, schema, setCurrentIndex]);

  return {
    visibleFields,
    currentField,
    currentVisibleIndex,
    isFirst,
    isLast,
    goNext,
    goBack,
  };
}
