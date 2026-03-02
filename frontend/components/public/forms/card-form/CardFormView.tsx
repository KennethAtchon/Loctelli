"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import type { FormTemplate, FormField } from "@/lib/forms/types";
import type { FlowchartNode } from "@/lib/forms/flowchart-types";
import { FieldRenderer } from "../shared/FieldRenderer";
import { ProgressIndicator } from "./progress-indicator";
import {
  PercentageResult,
  CategoryResult,
  MultiDimensionResult,
  RecommendationResult,
} from "./results";

const cardVariants = (reducedMotion: boolean) =>
  reducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (direction: number) => ({
          x: direction > 0 ? 320 : -320,
          opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({
          x: direction < 0 ? 320 : -320,
          opacity: 0,
        }),
      };

export interface CardFormViewProps {
  template: FormTemplate;
  schema: FormField[];
  successCard: FlowchartNode | null;
  formData: Record<string, unknown>;
  currentField: FormField | undefined;
  currentVisibleIndex: number;
  totalCards: number;
  isFirst: boolean;
  isLast: boolean;
  sessionRestored: boolean;
  isSubmitting: boolean;
  formError: string | null;
  success: boolean;
  profileResult: { type: string; result: Record<string, unknown> } | null;
  uploadedFiles: Record<string, File[]>;
  uploadingFiles: Record<string, boolean>;
  handleInputChange: (fieldId: string, value: unknown) => void;
  handleCheckboxChange: (
    fieldId: string,
    value: string,
    checked: boolean
  ) => void;
  handleFileUpload: (fieldId: string, file: File) => Promise<void>;
  goNext: () => void;
  goBack: () => void;
  handleSubmit: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  progressStyle?: "bar" | "dots" | "numbers";
  saveProgress?: boolean;
}

export function CardFormView({
  template,
  schema,
  successCard,
  formData,
  currentField,
  currentVisibleIndex,
  totalCards,
  isFirst,
  isLast,
  sessionRestored,
  isSubmitting,
  formError,
  success,
  profileResult,
  uploadedFiles,
  uploadingFiles,
  handleInputChange,
  handleCheckboxChange,
  handleFileUpload,
  goNext,
  goBack,
  handleSubmit,
  handleKeyDown,
  progressStyle = "bar",
  saveProgress = true,
}: CardFormViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Focus management
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [currentVisibleIndex]);

  const variants = cardVariants(reducedMotion);

  const formCardStyleBase: React.CSSProperties = {
    backgroundColor: "var(--form-card, hsl(var(--card)))",
    color: "var(--form-card-foreground, hsl(var(--card-foreground)))",
    borderColor: "var(--form-border, hsl(var(--border)))",
    borderRadius: "var(--form-card-radius, 0.5rem)",
    boxShadow: "var(--form-card-shadow)",
    maxWidth: "var(--form-card-max-width, 100%)",
    marginLeft: "auto",
    marginRight: "auto",
  };

  // Loading state
  if (!sessionRestored && saveProgress) {
    return (
      <Card style={formCardStyleBase}>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Empty form
  if (totalCards === 0) {
    return (
      <Card style={formCardStyleBase}>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-6">
            This form has no questions yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Success state with profile result
  if (success) {
    if (profileResult && template.profileEstimation?.enabled) {
      const { type, result } = profileResult;

      if (
        type === "percentage" &&
        template.profileEstimation.percentageConfig
      ) {
        const scoreValue = result.score;
        const score = typeof scoreValue === "number" ? scoreValue : 0;
        return (
          <PercentageResult
            config={template.profileEstimation.percentageConfig}
            score={score}
          />
        );
      }

      if (type === "category" && template.profileEstimation.categoryConfig) {
        const categoryValue = result.category;
        if (categoryValue && template.profileEstimation.categoryConfig) {
          const categoryObj =
            typeof categoryValue === "object" && categoryValue !== null
              ? (categoryValue as { id?: string; name?: string })
              : { name: String(categoryValue) };
          const foundCategory =
            template.profileEstimation.categoryConfig.categories.find(
              (c) =>
                c.id === categoryObj.id ||
                c.name === categoryObj.name ||
                c.name === categoryValue
            );

          if (foundCategory) {
            const confidenceValue = result.confidence;
            const confidence =
              typeof confidenceValue === "number" ? confidenceValue : 0;
            return (
              <CategoryResult
                config={template.profileEstimation.categoryConfig}
                category={foundCategory}
                confidence={confidence}
              />
            );
          }
        }
      }

      if (
        type === "multi_dimension" &&
        template.profileEstimation.dimensionConfig &&
        result.scores
      ) {
        const scoresValue = result.scores;
        const scores =
          typeof scoresValue === "object" &&
          scoresValue !== null &&
          !Array.isArray(scoresValue)
            ? (scoresValue as Record<string, number>)
            : {};
        if (
          template.profileEstimation.dimensionConfig &&
          Object.keys(scores).length > 0
        ) {
          return (
            <MultiDimensionResult
              config={template.profileEstimation.dimensionConfig}
              scores={scores}
            />
          );
        }
      }

      if (
        type === "recommendation" &&
        template.profileEstimation.recommendationConfig
      ) {
        const recommendationsValue = result.recommendations;
        const recommendations = Array.isArray(recommendationsValue)
          ? recommendationsValue.map((r: unknown) => {
              const rec = r as { recommendation?: unknown; score?: unknown };
              return {
                recommendation: (rec.recommendation || {}) as {
                  id: string;
                  name: string;
                  description: string;
                  image?: string;
                  matchingCriteria: unknown[];
                },
                score: typeof rec.score === "number" ? rec.score : 0,
              };
            })
          : [];
        if (
          recommendations.length > 0 &&
          template.profileEstimation.recommendationConfig
        ) {
          return (
            <RecommendationResult
              config={template.profileEstimation.recommendationConfig}
              recommendations={recommendations}
            />
          );
        }
      }
    }

    // Show success card if available
    if (successCard) {
      const successField: FormField = {
        id: successCard.data?.fieldId ?? successCard.id,
        type: "statement",
        label:
          successCard.data?.statementText ??
          successCard.data?.label ??
          "Thank you for your submission!",
        placeholder: successCard.data?.label,
        required: false,
        media: successCard.data?.media,
      };
      const formCardStyleSuccess: React.CSSProperties = {
        ...formCardStyleBase,
        backgroundColor: "var(--form-card, hsl(var(--card)))",
        color: "var(--form-card-foreground, hsl(var(--card-foreground)))",
        borderColor: "var(--form-border, hsl(var(--border)))",
        borderRadius: "var(--form-card-radius, 0.5rem)",
        boxShadow: "var(--form-card-shadow)",
      };
      return (
        <Card className="overflow-hidden" style={formCardStyleSuccess}>
          <CardContent className="pt-6">
            <FieldRenderer
              field={successField}
              value=""
              onChange={() => {}}
              mode="card"
              disabled={true}
              allFields={schema}
              formData={formData}
            />
          </CardContent>
        </Card>
      );
    }

    // Default success message
    const formCardStyleDefault: React.CSSProperties = {
      ...formCardStyleBase,
      backgroundColor: "var(--form-card, hsl(var(--card)))",
      color: "var(--form-card-foreground, hsl(var(--card-foreground)))",
      borderColor: "var(--form-border, hsl(var(--border)))",
      borderRadius: "var(--form-card-radius, 0.5rem)",
      boxShadow: "var(--form-card-shadow)",
    };
    return (
      <Card style={formCardStyleDefault}>
        <CardContent className="pt-6 text-center">
          <p className="text-lg text-foreground">
            Thank you for your submission!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Theme CSS vars (from template.styling) are set on a parent wrapper; use with fallbacks
  const formCardStyle = formCardStyleBase;
  const formHeadingStyle: React.CSSProperties = {
    fontFamily: "var(--form-font-heading, inherit)",
    color: "var(--form-foreground, hsl(var(--foreground)))",
  };
  const formBodyStyle: React.CSSProperties = {
    fontFamily: "var(--form-font-body, inherit)",
    fontSize: "var(--form-base-font-size, 1rem)",
    color: "var(--form-foreground, hsl(var(--foreground)))",
  };
  const formButtonRadiusStyle: React.CSSProperties = {
    borderRadius: "var(--form-button-radius, 0.375rem)",
  };
  const formOutlineButtonStyle: React.CSSProperties = {
    borderColor: "var(--form-border, hsl(var(--border)))",
    color: "var(--form-foreground, hsl(var(--foreground)))",
    ...formButtonRadiusStyle,
  };

  // Main form view
  return (
    <div className="space-y-4" style={formBodyStyle}>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold" style={formHeadingStyle}>
          {template.title}
        </h1>
        {template.subtitle && (
          <p className="text-muted-foreground" style={formBodyStyle}>
            {template.subtitle}
          </p>
        )}
      </div>
      <Card
        className="overflow-hidden"
        style={formCardStyle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        ref={cardRef}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4 mb-2">
            <ProgressIndicator
              current={currentVisibleIndex}
              total={totalCards}
              style={progressStyle}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground tabular-nums">
              {currentVisibleIndex + 1} / {totalCards}
            </span>
          </div>
        </CardHeader>
        <CardContent
          className={`flex flex-col relative overflow-hidden ${
            template.styling?.card?.height?.mobile
              ? `h-[${template.styling.card.height.mobile}]`
              : "h-[400px]"
          } ${
            template.styling?.card?.height?.tablet
              ? `md:h-[${template.styling.card.height.tablet}]`
              : "md:h-[600px]"
          } ${
            template.styling?.card?.height?.desktop
              ? `lg:h-[${template.styling.card.height.desktop}]`
              : "lg:h-[700px]"
          }`}
        >
          {formError && (
            <Alert variant="destructive" className="mb-4 flex-shrink-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="flex-1 flex items-center justify-center overflow-y-auto min-h-0 relative">
            <AnimatePresence mode="wait" custom={1}>
              {currentField && (
                <motion.div
                  key={currentField.id}
                  custom={1} // Direction: 1 = forward, -1 = backward (can be enhanced later)
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={
                    reducedMotion
                      ? { duration: 0.15 }
                      : {
                          x: { type: "spring", stiffness: 500, damping: 35 },
                          opacity: { duration: 0.2 },
                        }
                  }
                  className="focus:outline-none w-full p-4"
                >
                  {currentField.type === "statement" ? (
                    <FieldRenderer
                      field={currentField}
                      value=""
                      onChange={() => {}}
                      mode="card"
                      disabled={isSubmitting}
                      allFields={schema}
                      formData={formData}
                    />
                  ) : (
                    <FieldRenderer
                      field={currentField}
                      value={
                        formData[currentField.id] as
                          | string
                          | string[]
                          | undefined
                      }
                      onChange={(v) => handleInputChange(currentField.id, v)}
                      onCheckboxChange={(option, checked) =>
                        handleCheckboxChange(currentField.id, option, checked)
                      }
                      onFileUpload={(file) =>
                        handleFileUpload(currentField.id, file)
                      }
                      uploading={uploadingFiles[currentField.id]}
                      uploadedFile={uploadedFiles[currentField.id]}
                      disabled={isSubmitting}
                      allFields={schema}
                      formData={formData}
                      mode="card"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div
            className="flex-shrink-0 pt-4 border-t mt-auto"
            style={{ borderColor: "var(--form-border, hsl(var(--border)))" }}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isFirst || isSubmitting}
                className="gap-2"
                style={formOutlineButtonStyle}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              {isLast ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                  style={formButtonRadiusStyle}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={isSubmitting}
                  style={formButtonRadiusStyle}
                >
                  Continue
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Press{" "}
              <kbd className="rounded border px-1.5 py-0.5 font-mono">
                Enter
              </kbd>{" "}
              to continue ·{" "}
              <kbd className="rounded border px-1.5 py-0.5 font-mono">Esc</kbd>{" "}
              to go back
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
