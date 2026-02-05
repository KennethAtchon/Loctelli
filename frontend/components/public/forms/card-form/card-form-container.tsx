"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import type { FormTemplate, FormField, FormsApi } from "@/lib/api";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";
import { CardFieldRenderer } from "./card-field-renderer";
import { ProgressIndicator, getCardFormSessionKey } from "./progress-indicator";
import {
  getNextCardIndex,
  getVisibleFields,
  getDynamicLabel,
  shouldShowField,
} from "@/lib/forms/conditional-logic";
import { calculateProfileEstimation } from "@/lib/forms/profile-estimation";
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

export interface CardFormContainerProps {
  slug: string;
  template: FormTemplate;
  formsApi: FormsApi;
  saveProgress?: boolean;
  progressStyle?: "bar" | "dots" | "numbers";
  onSuccess?: () => void;
}

export function CardFormContainer({
  slug,
  template,
  formsApi,
  saveProgress = true,
  progressStyle = "bar",
  onSuccess,
}: CardFormContainerProps) {
  const schema = (template.schema ?? []) as FormField[];

  // Get flowchart graph to find success card
  const flowchartGraph = useMemo(() => {
    const cardSettings = template.cardSettings as
      | { flowchartGraph?: FlowchartGraph }
      | undefined;
    return cardSettings?.flowchartGraph;
  }, [template.cardSettings]);

  // Find success card from flowchart graph
  const successCard = useMemo(() => {
    if (!flowchartGraph) return null;
    return flowchartGraph.nodes.find(
      (node) => node.type === "statement" && node.data?.isSuccessCard === true
    );
  }, [flowchartGraph]);

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profileResult, setProfileResult] = useState<{
    type: string;
    result: Record<string, unknown>;
    aiEnhanced?: boolean;
    aiResult?: Record<string, unknown>;
    error?: string;
  } | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [cardStartTimes, setCardStartTimes] = useState<Record<number, number>>(
    {}
  );
  const [formViewed, setFormViewed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { url: string; originalName: string }>
  >({});
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const variants = cardVariants(!!reducedMotion);

  // Get visible fields based on conditional logic - memoized to prevent infinite loops
  const visibleFields = useMemo(
    () => getVisibleFields(schema, formData),
    [schema, formData]
  );
  const totalCards = visibleFields.length;

  // Find the current field in the visible fields array
  const currentVisibleIndex = Math.min(currentIndex, visibleFields.length - 1);
  const currentField = visibleFields[currentVisibleIndex];
  const isFirst = currentVisibleIndex === 0;
  const isLast = currentVisibleIndex === visibleFields.length - 1;

  const initFormData = useCallback(() => {
    const initial: Record<string, unknown> = {};
    schema.forEach((f: FormField) => {
      if (f.type === "checkbox") initial[f.id] = [];
      else initial[f.id] = "";
    });
    return initial;
  }, [schema]);

  useEffect(() => {
    setFormData(initFormData());
  }, [initFormData]);

  const persistSessionToken = useCallback(
    (token: string) => {
      setSessionToken(token);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(getCardFormSessionKey(slug), token);
        } catch {
          // ignore
        }
      }
    },
    [slug]
  );

  useEffect(() => {
    if (!template || totalCards === 0 || !saveProgress) {
      setSessionRestored(true);
      return;
    }
    let cancelled = false;
    const storedToken =
      typeof window !== "undefined"
        ? sessionStorage.getItem(getCardFormSessionKey(slug))
        : null;

    async function initSession() {
      try {
        if (storedToken) {
          const session = await formsApi.getFormSession(slug, storedToken);
          if (!cancelled && session) {
            setCurrentIndex(Math.min(session.currentCardIndex, totalCards - 1));
            if (
              session.partialData &&
              typeof session.partialData === "object" &&
              Object.keys(session.partialData).length > 0
            ) {
              setFormData((prev) => ({
                ...initFormData(),
                ...session.partialData,
              }));
            }
            setSessionToken(session.sessionToken);
            setSessionRestored(true);
            return;
          }
        }
        const created = await formsApi.createFormSession(slug, {
          deviceType:
            typeof navigator !== "undefined"
              ? (navigator as { userAgentData?: { mobile?: boolean } })
                  .userAgentData?.mobile
                ? "mobile"
                : "desktop"
              : undefined,
        });
        if (!cancelled && created) {
          persistSessionToken(created.sessionToken);
        }
      } catch {
        if (!cancelled) {
          const created = await formsApi
            .createFormSession(slug)
            .catch(() => null);
          if (created) persistSessionToken(created.sessionToken);
        }
      } finally {
        if (!cancelled) setSessionRestored(true);
      }
    }
    initSession();
    return () => {
      cancelled = true;
    };
  }, [
    slug,
    totalCards,
    saveProgress,
    formsApi,
    initFormData,
    persistSessionToken,
    template,
  ]);

  const validateCurrent = useCallback((): boolean => {
    if (!currentField) return true;
    if (currentField.type === "statement") return true; // Statements don't need validation
    if (!currentField.required) return true;
    const value = formData[currentField.id];
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== "";
  }, [currentField, formData]);

  const goNext = useCallback(async () => {
    if (!validateCurrent()) {
      setFormError("Please complete this question to continue.");
      return;
    }
    setFormError(null);
    if (isLast) return;
    setDirection(1);

    // Use conditional logic to determine next card
    const nextVisibleIndex = getNextCardIndex(
      currentVisibleIndex,
      visibleFields,
      formData
    );
    const nextField = visibleFields[nextVisibleIndex];

    // Find the actual index in the full schema
    const nextSchemaIndex = nextField
      ? schema.findIndex((f) => f.id === nextField.id)
      : currentIndex + 1;
    const finalNextIndex =
      nextSchemaIndex !== -1 ? nextSchemaIndex : currentIndex + 1;

    setCurrentIndex(finalNextIndex);
    if (saveProgress && sessionToken) {
      try {
        await formsApi.updateFormSession(slug, sessionToken, {
          currentCardIndex: finalNextIndex,
          partialData: formData,
        });
      } catch {
        // non-blocking
      }
    }
  }, [
    validateCurrent,
    isLast,
    currentIndex,
    currentVisibleIndex,
    visibleFields,
    schema,
    formData,
    saveProgress,
    sessionToken,
    slug,
    formsApi,
  ]);

  const goBack = useCallback(() => {
    setFormError(null);
    if (isFirst) return;
    setDirection(-1);
    // Go back to previous visible field
    const prevVisibleIndex = currentVisibleIndex - 1;
    if (prevVisibleIndex >= 0) {
      const prevField = visibleFields[prevVisibleIndex];
      const prevSchemaIndex = prevField
        ? schema.findIndex((f) => f.id === prevField.id)
        : currentIndex - 1;
      setCurrentIndex(
        prevSchemaIndex !== -1 ? prevSchemaIndex : currentIndex - 1
      );
    } else {
      setCurrentIndex((i) => Math.max(0, i - 1));
    }
  }, [isFirst, currentVisibleIndex, visibleFields, schema, currentIndex]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrent()) {
      setFormError("Please complete this question to continue.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      // Calculate profile estimation if enabled
      if (template.profileEstimation?.enabled) {
        try {
          // If AI is enabled, call backend API
          if (template.profileEstimation.aiConfig?.enabled) {
            const aiResult = await formsApi.calculateProfileEstimation(
              slug,
              formData
            );
            if (aiResult) {
              setProfileResult(aiResult);
            }
          } else {
            // Use rule-based calculation
            const result = calculateProfileEstimation(
              template.profileEstimation,
              formData,
              schema
            );
            if (result) {
              setProfileResult(result);
            }
          }
        } catch (err) {
          // Fallback to rule-based if AI fails
          console.warn("AI calculation failed, using rule-based:", err);
          const result = calculateProfileEstimation(
            template.profileEstimation,
            formData,
            schema
          );
          if (result) {
            setProfileResult(result);
          }
        }
      }

      await formsApi.submitPublicForm(slug, {
        data: formData,
        files: uploadedFiles,
        source: "website",
      });
      if (sessionToken) {
        await formsApi.completeFormSession(slug, sessionToken);
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(getCardFormSessionKey(slug));
      }
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to submit. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateCurrent,
    formData,
    uploadedFiles,
    slug,
    sessionToken,
    formsApi,
    onSuccess,
    template,
    schema,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        goBack();
      }
      if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (isLast) handleSubmit();
        else goNext();
      }
    },
    [goBack, goNext, isLast, handleSubmit]
  );

  const handleInputChange = useCallback(
    (fieldId: string, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [fieldId]: value }));
    },
    []
  );

  const handleCheckboxChange = useCallback(
    (fieldId: string, option: string, checked: boolean) => {
      setFormData((prev) => {
        const current = (prev[fieldId] as string[] | undefined) || [];
        if (checked) return { ...prev, [fieldId]: [...current, option] };
        return { ...prev, [fieldId]: current.filter((x) => x !== option) };
      });
    },
    []
  );

  const handleFileUpload = useCallback(
    async (fieldId: string, file: File) => {
      try {
        setUploadingFiles((prev) => ({ ...prev, [fieldId]: true }));
        setFormError(null);
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("fieldId", fieldId);
        const result = await formsApi.uploadFormFile(slug, formDataUpload);
        setUploadedFiles((prev) => ({ ...prev, [fieldId]: result }));
        handleInputChange(fieldId, result.url);
      } catch {
        setFormError("Failed to upload file. Please try again.");
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    [slug, formsApi, handleInputChange]
  );

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [currentIndex]);

  // Track form view
  useEffect(() => {
    if (!formViewed && template.analyticsEnabled && sessionRestored) {
      setFormViewed(true);
      // Form view is tracked via session creation, so this is already handled
    }
  }, [formViewed, template.analyticsEnabled, sessionRestored]);

  // Track time per card - use refs to prevent infinite loops
  const previousCardIdRef = useRef<string | null>(null);
  const cardStartTimeRef = useRef<number | null>(null);
  const previousIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!template.analyticsEnabled || !sessionToken) return;

    // Get current field from visible fields (memoized, so safe to access)
    const currentField = visibleFields[currentVisibleIndex];
    if (!currentField) return;

    const currentCardId = currentField.id;
    const hasCardChanged = previousIndexRef.current !== currentIndex;

    // Only track if we've moved to a different card (by index)
    if (
      hasCardChanged &&
      previousCardIdRef.current !== null &&
      previousCardIdRef.current !== currentCardId
    ) {
      // Track time for the previous card before switching
      const endTime = Date.now();
      const startTime = cardStartTimeRef.current;
      if (startTime !== null && previousCardIdRef.current) {
        const timeSpent = (endTime - startTime) / 1000; // Convert to seconds
        if (timeSpent > 0) {
          formsApi
            .trackCardTime(slug, {
              sessionToken,
              cardId: previousCardIdRef.current,
              timeSeconds: Math.round(timeSpent),
            })
            .catch(() => {
              // Non-blocking - analytics failures shouldn't break the form
            });
        }
      }
    }

    // Only update start time if card actually changed
    if (hasCardChanged) {
      const startTime = Date.now();
      cardStartTimeRef.current = startTime;
      previousCardIdRef.current = currentCardId;
      previousIndexRef.current = currentIndex;
      setCardStartTimes((prev) => ({ ...prev, [currentIndex]: startTime }));
    }

    // Cleanup: track time when component unmounts
    return () => {
      // Only track on unmount if we have a valid card
      if (
        previousCardIdRef.current &&
        cardStartTimeRef.current !== null &&
        sessionToken
      ) {
        const endTime = Date.now();
        const startTime = cardStartTimeRef.current;
        const timeSpent = (endTime - startTime) / 1000;
        if (timeSpent > 0) {
          formsApi
            .trackCardTime(slug, {
              sessionToken,
              cardId: previousCardIdRef.current,
              timeSeconds: Math.round(timeSpent),
            })
            .catch(() => {
              // Non-blocking - analytics failures shouldn't break the form
            });
        }
      }
    };
    // Only depend on currentIndex - this prevents infinite loops when visibleFields changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentIndex,
    // Note: visibleFields and currentVisibleIndex are intentionally excluded from dependencies
    // to prevent infinite loops. They're memoized and accessed inside the effect safely.
    // We only want to track when currentIndex changes (user navigates to a different card).
    sessionToken,
    slug,
    template.analyticsEnabled,
    formsApi,
  ]);

  // Update current index when visible fields change (due to conditional logic)
  useEffect(() => {
    if (currentField && !shouldShowField(currentField, formData)) {
      // Current field is now hidden, move to next visible field
      const nextVisibleIndex = currentVisibleIndex + 1;
      if (nextVisibleIndex < visibleFields.length) {
        const nextField = visibleFields[nextVisibleIndex];
        const nextSchemaIndex = nextField
          ? schema.findIndex((f) => f.id === nextField.id)
          : currentIndex + 1;
        if (nextSchemaIndex !== -1) {
          setCurrentIndex(nextSchemaIndex);
        }
      }
    }
  }, [
    formData,
    currentField,
    currentVisibleIndex,
    visibleFields,
    schema,
    currentIndex,
  ]);

  if (totalCards === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-6">
            This form has no questions yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    // Show profile estimation result if available
    if (profileResult && template.profileEstimation?.enabled) {
      const { type, result, aiEnhanced, aiResult } = profileResult;

      // Use AI result if available, otherwise use rule-based result
      const displayResult =
        aiEnhanced && aiResult ? { ...result, ...aiResult } : result;

      if (
        type === "percentage" &&
        template.profileEstimation.percentageConfig
      ) {
        const scoreValue = displayResult.score || result.score;
        const score = typeof scoreValue === "number" ? scoreValue : 0;
        return (
          <PercentageResult
            config={template.profileEstimation.percentageConfig}
            score={score}
          />
        );
      }

      if (type === "category" && template.profileEstimation.categoryConfig) {
        const categoryValue = displayResult.category || result.category;
        if (categoryValue && template.profileEstimation.categoryConfig) {
          // Find category in config or use AI result
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

          if (!foundCategory) {
            // If category not found, skip rendering
            return null;
          }

          const categoryConfig = foundCategory;

          const confidenceValue = displayResult.confidence || result.confidence;
          const confidence =
            typeof confidenceValue === "number" ? confidenceValue : 0;
          return (
            <CategoryResult
              config={template.profileEstimation.categoryConfig}
              category={categoryConfig}
              confidence={confidence}
            />
          );
        }
      }

      if (
        type === "multi_dimension" &&
        template.profileEstimation.dimensionConfig &&
        (displayResult.scores || result.scores)
      ) {
        const scoresValue = displayResult.scores || result.scores;
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
        const recommendationsValue =
          displayResult.recommendations || result.recommendations;
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

    // Show success card if available, otherwise default message
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
      return (
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <CardFieldRenderer
              field={successField}
              value=""
              onChange={() => {}}
              disabled={true}
              allFields={schema}
              formData={formData}
            />
          </CardContent>
        </Card>
      );
    }

    // Default success message (fallback if no success card)
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-lg text-foreground">
            Thank you for your submission!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!sessionRestored && saveProgress) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">{template.title}</h1>
        {template.subtitle && (
          <p className="text-muted-foreground">{template.subtitle}</p>
        )}
      </div>
      <Card
        className="overflow-hidden"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        ref={cardRef}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4 mb-2">
            <ProgressIndicator
              current={currentIndex}
              total={totalCards}
              style={progressStyle}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground tabular-nums">
              {currentIndex + 1} / {totalCards}
            </span>
          </div>
        </CardHeader>
        <CardContent className="h-[500px] md:h-[700px] lg:h-[800px] flex flex-col relative overflow-hidden">
        {formError && (
          <Alert variant="destructive" className="mb-4 flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <div className="flex-1 flex items-center justify-center overflow-y-auto min-h-0 relative">
          <AnimatePresence custom={direction}>
            {currentField && (
              <motion.div
                key={currentIndex}
                custom={direction}
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
                  <CardFieldRenderer
                    field={currentField}
                    value=""
                    onChange={() => {}}
                    disabled={isSubmitting}
                    allFields={schema}
                    formData={formData}
                  />
                ) : (
                  <CardFieldRenderer
                    field={currentField}
                    value={
                      formData[currentField.id] as string | string[] | undefined
                    }
                    onChange={(v) => handleInputChange(currentField.id, v)}
                    onCheckboxChange={(option, checked) =>
                      handleCheckboxChange(currentField.id, option, checked)
                    }
                    onFileUpload={handleFileUpload}
                    uploading={uploadingFiles[currentField.id]}
                    uploadedFile={uploadedFiles[currentField.id]}
                    disabled={isSubmitting}
                    allFields={schema}
                    formData={formData}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex-shrink-0 pt-4 border-t mt-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isFirst || isSubmitting}
              className="gap-2"
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
              <Button type="button" onClick={goNext} disabled={isSubmitting}>
                Continue
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Press{" "}
            <kbd className="rounded border px-1.5 py-0.5 font-mono">Enter</kbd> to
            continue ·{" "}
            <kbd className="rounded border px-1.5 py-0.5 font-mono">Esc</kbd> to
            go back
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
