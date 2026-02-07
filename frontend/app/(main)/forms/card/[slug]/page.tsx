"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import logger from "@/lib/logger";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";
import { CardFormContainer } from "@/components/public/forms/card-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PUBLIC_FORM_STALE_MS = 5 * 60 * 1000; // 5 min

export default function PublicCardFormPage() {
  const params = useParams();
  const slug = params.slug as string;
  const formsApi = api.forms;

  // Ping database on mount to keep it warm
  useEffect(() => {
    if (slug && slug !== "invalid-form") {
      formsApi.pingDatabase().catch((error) => {
        logger.warn("Database ping failed (non-blocking):", error);
      });
    }
  }, [slug, formsApi]);

  const formQuery = useQuery({
    queryKey: ["form", "public", "card", slug],
    queryFn: () => formsApi.getPublicForm(slug),
    enabled: !!slug && slug !== "invalid-form",
    staleTime: PUBLIC_FORM_STALE_MS,
    retry: 2,
    retryDelay: (attemptIndex) => (attemptIndex + 1) * 500,
  });

  const template = formQuery.data ?? null;
  const isLoading = formQuery.isLoading;
  const loadError = formQuery.error
    ? formQuery.error instanceof Error
      ? formQuery.error.message
      : "Failed to load form"
    : slug === "invalid-form"
      ? "Invalid form URL"
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading form...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loadError && !template) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  if (template && template.formType !== "CARD") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This form is not a card form. Use the standard form link instead.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  if (!template) return null;

  const cardSettings = template.cardSettings as
    | { progressStyle?: "bar" | "dots" | "numbers"; saveProgress?: boolean }
    | undefined;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <Navigation />
      <div className="flex-1 py-8 flex items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          <CardFormContainer
            slug={slug}
            template={template}
            formsApi={formsApi}
            saveProgress={cardSettings?.saveProgress ?? true}
            progressStyle={cardSettings?.progressStyle ?? "bar"}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
