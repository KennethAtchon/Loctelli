"use client";

import { useState } from "react";
import { Plus, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormFieldEditor } from "../form-field-editor";
import { JsonImportDialog } from "../json-import-dialog";
import { SimpleFormAIBuilderModal } from "../simple-form-ai-builder-modal";
import type { FormField } from "@/lib/forms/types";
import type { CreateFormTemplateDto, FormStyling } from "@/lib/forms/types";

type OnFormPropertyChange<T> = (value: T) => void;

interface AIBuilderProps {
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  submitButtonText: string;
  successMessage: string;
  styling?: FormStyling;
  onNameChange?: OnFormPropertyChange<string>;
  onTitleChange?: OnFormPropertyChange<string>;
  onSubtitleChange?: OnFormPropertyChange<string>;
  onDescriptionChange?: OnFormPropertyChange<string>;
  onSubmitButtonTextChange?: OnFormPropertyChange<string>;
  onSuccessMessageChange?: OnFormPropertyChange<string>;
  onStylingChange?: OnFormPropertyChange<FormStyling>;
}

interface FormFieldsSectionProps {
  schema: FormField[];
  onAddField: () => void;
  onUpdateField: (index: number, updates: Partial<FormField>) => void;
  onRemoveField: (index: number) => void;
  onImportFields: (fields: FormField[]) => void;
  onExportSchema: () => void;
  // AI builder props
  AIBuilder: AIBuilderProps;
}

export function FormFieldsSection({
  schema,
  onAddField,
  onUpdateField,
  onRemoveField,
  onImportFields,
  onExportSchema,
  AIBuilder,
}: FormFieldsSectionProps) {
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const getFullSimpleFormPayload = (): CreateFormTemplateDto => ({
    name: AIBuilder.name,
    slug: AIBuilder.slug,
    description: AIBuilder.description || "",
    formType: "SIMPLE",
    schema,
    title: AIBuilder.title,
    subtitle: AIBuilder.subtitle,
    submitButtonText: AIBuilder.submitButtonText,
    successMessage: AIBuilder.successMessage,
    styling: AIBuilder.styling || null,
    analyticsEnabled: false,
  });

  const handleImportFullSimpleForm = (payload: CreateFormTemplateDto) => {
    // Update schema
    onImportFields(payload.schema || []);

    // Update other form properties if callbacks are provided
    if (
      AIBuilder.onNameChange &&
      payload.name &&
      payload.name !== AIBuilder.name
    ) {
      AIBuilder.onNameChange(payload.name);
    }
    if (
      AIBuilder.onTitleChange &&
      payload.title &&
      payload.title !== AIBuilder.title
    ) {
      AIBuilder.onTitleChange(payload.title);
    }
    if (
      AIBuilder.onSubtitleChange &&
      payload.subtitle &&
      payload.subtitle !== AIBuilder.subtitle
    ) {
      AIBuilder.onSubtitleChange(payload.subtitle);
    }
    if (
      AIBuilder.onDescriptionChange &&
      payload.description &&
      payload.description !== AIBuilder.description
    ) {
      AIBuilder.onDescriptionChange(payload.description);
    }
    if (
      AIBuilder.onSubmitButtonTextChange &&
      payload.submitButtonText &&
      payload.submitButtonText !== AIBuilder.submitButtonText
    ) {
      AIBuilder.onSubmitButtonTextChange(payload.submitButtonText);
    }
    if (
      AIBuilder.onSuccessMessageChange &&
      payload.successMessage &&
      payload.successMessage !== AIBuilder.successMessage
    ) {
      AIBuilder.onSuccessMessageChange(payload.successMessage);
    }
    if (
      AIBuilder.onStylingChange &&
      payload.styling &&
      payload.styling !== AIBuilder.styling
    ) {
      AIBuilder.onStylingChange(payload.styling);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Form Fields
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAiModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Build with AI
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportSchema}
              disabled={schema.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <JsonImportDialog onImport={onImportFields} />
            <Button type="button" onClick={onAddField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Define the fields that users will fill out. Use JSON import for bulk
          operations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {schema.map((field, index) => (
          <FormFieldEditor
            key={field.id}
            field={field}
            index={index}
            onUpdate={(updates) => onUpdateField(index, updates)}
            onRemove={() => onRemoveField(index)}
          />
        ))}

        {schema.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No fields added yet. Click "Add Field" to get started, or try "Build
            with AI" to generate a complete form.
          </div>
        )}
      </CardContent>

      <SimpleFormAIBuilderModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        getFullSimpleFormPayload={getFullSimpleFormPayload}
        onImportFullSimpleForm={handleImportFullSimpleForm}
      />
    </Card>
  );
}
