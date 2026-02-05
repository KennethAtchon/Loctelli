import { useMemo, useCallback } from "react";
import type { FormField } from "@/lib/forms/types";
import {
  getVisibleFields,
  getNextCardIndex,
} from "@/lib/forms/conditional-logic";
import { clampToVisible } from "@/lib/forms/navigation";
import logger from "@/lib/logger";

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
  const visibleFields = useMemo(() => {
    const fields = getVisibleFields(schema, formData);
    logger.debug("👁️ useCardFormNavigation: Visible fields updated", {
      totalFields: schema.length,
      visibleCount: fields.length,
      visibleIds: fields.map((f) => f.id),
    });
    return fields;
  }, [schema, formData]);

  // Clamp current index to visible fields (forward bias)
  const currentVisibleIndex = useMemo(() => {
    const clamped = clampToVisible(schema, visibleFields, currentIndex);
    if (clamped !== currentIndex) {
      logger.debug("🔧 useCardFormNavigation: Index clamped", {
        originalIndex: currentIndex,
        clampedIndex: clamped,
        visibleFieldsCount: visibleFields.length,
      });
    }
    return clamped;
  }, [schema, visibleFields, currentIndex]);

  // Current field from visible fields
  const currentField = visibleFields[currentVisibleIndex];

  // Navigation flags
  const isFirst = currentVisibleIndex === 0;
  const isLast = currentVisibleIndex === visibleFields.length - 1;

  // Navigate to next card
  const goNext = useCallback(() => {
    logger.debug("➡️ useCardFormNavigation: goNext called", {
      currentVisibleIndex,
      isLast,
      visibleFieldsCount: visibleFields.length,
    });
    if (isLast) {
      logger.debug("⏹️ useCardFormNavigation: Already at last card");
      return;
    }

    const nextVisibleIndex = getNextCardIndex(
      currentVisibleIndex,
      visibleFields,
      formData
    );

    logger.debug("🔍 useCardFormNavigation: Next index calculated", {
      nextVisibleIndex,
      currentVisibleIndex,
    });

    if (nextVisibleIndex >= 0 && nextVisibleIndex < visibleFields.length) {
      // Find the schema index for the next visible field
      const nextField = visibleFields[nextVisibleIndex];
      const schemaIndex = schema.findIndex((f) => f.id === nextField.id);
      if (schemaIndex >= 0) {
        logger.debug("✅ useCardFormNavigation: Navigating to next card", {
          nextFieldId: nextField.id,
          schemaIndex,
          nextVisibleIndex,
        });
        setCurrentIndex(schemaIndex);
      } else {
        // Fallback: increment current index
        logger.warn(
          "⚠️ useCardFormNavigation: Field not found in schema, using fallback",
          {
            nextFieldId: nextField.id,
          }
        );
        setCurrentIndex((prev) => prev + 1);
      }
    } else if (nextVisibleIndex === -1) {
      // At end, but isLast should have caught this
      logger.debug("⏹️ useCardFormNavigation: Next index is -1 (at end)");
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
    logger.debug("⬅️ useCardFormNavigation: goBack called", {
      currentVisibleIndex,
      isFirst,
    });
    if (isFirst) {
      logger.debug("⏹️ useCardFormNavigation: Already at first card");
      return;
    }

    const prevVisibleIndex = currentVisibleIndex - 1;
    if (prevVisibleIndex >= 0) {
      const prevField = visibleFields[prevVisibleIndex];
      const schemaIndex = schema.findIndex((f) => f.id === prevField.id);
      if (schemaIndex >= 0) {
        logger.debug("✅ useCardFormNavigation: Navigating to previous card", {
          prevFieldId: prevField.id,
          schemaIndex,
          prevVisibleIndex,
        });
        setCurrentIndex(schemaIndex);
      } else {
        // Fallback: decrement current index
        logger.warn(
          "⚠️ useCardFormNavigation: Field not found in schema, using fallback",
          {
            prevFieldId: prevField.id,
          }
        );
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
