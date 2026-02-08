"use client";

import type { FormTemplate } from "@/lib/forms/types";
import type { FormsApi } from "@/lib/api";
import { useCardFormState } from "./hooks/useCardFormState";
import { CardFormView } from "./CardFormView";

export interface CardFormContainerProps {
  slug: string;
  template: FormTemplate;
  formsApi: FormsApi;
  saveProgress?: boolean;
  progressStyle?: "bar" | "dots" | "numbers";
  onSuccess?: () => void;
}

/**
 * Thin container component for card forms.
 * Uses useCardFormState hook to manage all form logic and state.
 * Renders CardFormView with the state and callbacks.
 */
export function CardFormContainer({
  slug,
  template,
  saveProgress = true,
  progressStyle = "bar",
}: CardFormContainerProps) {
  const formState = useCardFormState(slug, template, {
    saveProgress,
    analyticsEnabled: template.analyticsEnabled ?? false,
  });

  // Note: onSuccess callback handling
  // The onSuccess callback is available if needed, but typically success handling
  // is done in the CardFormView component or parent component.
  // If you need to call onSuccess when form succeeds, use useEffect:
  // useEffect(() => {
  //   if (formState.success && onSuccess) {
  //     onSuccess();
  //   }
  // }, [formState.success, onSuccess]);

  return (
    <CardFormView
      template={template}
      schema={formState.schema}
      successCard={formState.successCard}
      formData={formState.formData}
      currentField={formState.currentField}
      currentVisibleIndex={formState.currentVisibleIndex}
      totalCards={formState.totalCards}
      isFirst={formState.isFirst}
      isLast={formState.isLast}
      sessionRestored={formState.sessionRestored}
      isSubmitting={formState.isSubmitting}
      formError={formState.formError}
      success={formState.success}
      profileResult={formState.profileResult}
      uploadedFiles={formState.uploadedFiles}
      uploadingFiles={formState.uploadingFiles}
      handleInputChange={formState.handleInputChange}
      handleCheckboxChange={formState.handleCheckboxChange}
      handleFileUpload={formState.handleFileUpload}
      goNext={formState.goNext}
      goBack={formState.goBack}
      handleSubmit={formState.handleSubmit}
      handleKeyDown={formState.handleKeyDown}
      progressStyle={progressStyle}
      saveProgress={saveProgress}
    />
  );
}
