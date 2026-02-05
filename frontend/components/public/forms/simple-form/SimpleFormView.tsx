"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import type { FormTemplate, FormField } from "@/lib/forms/types";
import { useSimpleFormState } from "./useSimpleFormState";
import { FieldRenderer } from "../shared/FieldRenderer";

export interface SimpleFormViewProps {
  template: FormTemplate;
  slug: string;
  onSubmitSuccess?: (result: unknown) => void;
  onSubmitError?: (error: Error) => void;
}

export function SimpleFormView({
  template,
  slug,
  onSubmitSuccess,
  onSubmitError,
}: SimpleFormViewProps) {
  const schema = (template.schema ?? []) as FormField[];
  const [success, setSuccess] = React.useState(false);

  const {
    formData,
    uploadedFiles,
    uploadingFiles,
    isSubmitting,
    formError,
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload,
    handleSubmit,
  } = useSimpleFormState(schema, slug, {
    onSubmitSuccess: (result) => {
      setSuccess(true);
      onSubmitSuccess?.(result);
    },
    onSubmitError,
  });

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
          <p className="text-gray-600">
            {template.successMessage || "Your form has been submitted successfully."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.title}</CardTitle>
        {template.subtitle && (
          <CardDescription>{template.subtitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="space-y-6">
            {schema.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id] as string | string[] | undefined}
                onChange={(value) => handleInputChange(field.id, value)}
                onCheckboxChange={(option, checked) =>
                  handleCheckboxChange(field.id, option, checked)
                }
                onFileUpload={(file) => handleFileUpload(field.id, file)}
                mode="simple"
                formData={formData}
                allFields={schema}
                uploading={uploadingFiles[field.id]}
                uploadedFile={uploadedFiles[field.id]}
                disabled={isSubmitting}
                error={
                  formError && field.required && !formData[field.id]
                    ? `${field.label} is required`
                    : undefined
                }
              />
            ))}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              template.submitButtonText || "Submit"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
