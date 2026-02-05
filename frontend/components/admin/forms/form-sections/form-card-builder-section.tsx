"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardFormBuilder } from "../card-form-builder";
import type { FormField } from "@/lib/api/endpoints/forms";

interface FormCardBuilderSectionProps {
  schema: FormField[];
  cardSettings?: Record<string, unknown>;
  onSchemaChange: (schema: FormField[]) => void;
  onCardSettingsChange: (settings: Record<string, unknown>) => void;
  formSlug?: string;
  description?: string;
}

export function FormCardBuilderSection({
  schema,
  cardSettings,
  onSchemaChange,
  onCardSettingsChange,
  formSlug,
  description = "Build your interactive card form using the flowchart editor",
}: FormCardBuilderSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Form Builder</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <CardFormBuilder
          schema={schema}
          cardSettings={cardSettings}
          onSchemaChange={onSchemaChange}
          onCardSettingsChange={onCardSettingsChange}
          formSlug={formSlug}
        />
      </CardContent>
    </Card>
  );
}
