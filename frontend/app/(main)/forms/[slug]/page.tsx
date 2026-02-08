"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import logger from "@/lib/logger";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";
import { SimpleFormView } from "@/components/public/forms/simple-form/SimpleFormView";

const PUBLIC_FORM_STALE_MS = 5 * 60 * 1000; // 5 min

export default function PublicFormPage() {
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
    queryKey: ["form", "public", slug],
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

  if (!template) return null;

  if (template.formType === "CARD") {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Card form</CardTitle>
              <CardDescription>
                This form is a card form and is available at a different
                address. Use the link below to open it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/forms/card/${slug}`}>
                <Button className="w-full">Open card form</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <SimpleFormView
            template={template}
            slug={slug}
            onSubmitSuccess={() => {
              // Success is handled by SimpleFormView showing success message
            }}
            onSubmitError={(error) => {
              logger.error("Form submission error:", error);
            }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
