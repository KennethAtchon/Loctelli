"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { CardFieldRenderer } from "./card-field-renderer";
import {
  ProgressIndicator,
  getCardFormSessionKey,
} from "./progress-indicator";

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
  const totalCards = schema.length;

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { url: string; originalName: string }>
  >({});
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const variants = cardVariants(!!reducedMotion);

  const currentField = schema[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalCards - 1;

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
              setFormData((prev) => ({ ...initFormData(), ...session.partialData }));
            }
            setSessionToken(session.sessionToken);
            setSessionRestored(true);
            return;
          }
        }
        const created = await formsApi.createFormSession(slug, {
          deviceType: typeof navigator !== "undefined" ? (navigator as { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ? "mobile" : "desktop" : undefined,
        });
        if (!cancelled && created) {
          persistSessionToken(created.sessionToken);
        }
      } catch {
        if (!cancelled) {
          const created = await formsApi.createFormSession(slug).catch(() => null);
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
  }, [slug, totalCards, saveProgress, formsApi, initFormData, persistSessionToken, template]);

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
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    if (saveProgress && sessionToken) {
      try {
        await formsApi.updateFormSession(slug, sessionToken, {
          currentCardIndex: nextIndex,
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
    saveProgress,
    sessionToken,
    slug,
    formData,
    formsApi,
  ]);

  const goBack = useCallback(() => {
    setFormError(null);
    if (isFirst) return;
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  }, [isFirst]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrent()) {
      setFormError("Please complete this question to continue.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
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
        err instanceof Error ? err.message : "Failed to submit. Please try again."
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

  const handleInputChange = useCallback((fieldId: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

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
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-lg text-foreground">
            {template.successMessage ?? "Thank you for your submission!"}
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
        <CardTitle className="text-xl">{template.title}</CardTitle>
        {template.subtitle && (
          <CardDescription>{template.subtitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="min-h-[240px] relative">
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <AnimatePresence mode="wait" custom={direction}>
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
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.15 },
                    }
              }
              className="focus:outline-none"
            >
              {currentField.type === "statement" ? (
                <CardFieldRenderer
                  field={currentField}
                  value=""
                  onChange={() => {}}
                  disabled={isSubmitting}
                />
              ) : (
                <CardFieldRenderer
                  field={currentField}
                  value={formData[currentField.id] as string | string[] | undefined}
                  onChange={(v) => handleInputChange(currentField.id, v)}
                  onCheckboxChange={(option, checked) =>
                    handleCheckboxChange(currentField.id, option, checked)
                  }
                  onFileUpload={handleFileUpload}
                  uploading={uploadingFiles[currentField.id]}
                  uploadedFile={uploadedFiles[currentField.id]}
                  disabled={isSubmitting}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t">
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
                template.submitButtonText ?? "Submit"
              )}
            </Button>
          ) : (
            <Button type="button" onClick={goNext} disabled={isSubmitting}>
              Continue
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Press <kbd className="rounded border px-1.5 py-0.5 font-mono">Enter</kbd> to
          continue · <kbd className="rounded border px-1.5 py-0.5 font-mono">Esc</kbd> to
          go back
        </p>
      </CardContent>
    </Card>
  );
}
