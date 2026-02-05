"use client";

import { Plus, Download } from "lucide-react";
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
import type { FormField } from "@/lib/forms/types";

interface FormFieldsSectionProps {
  schema: FormField[];
  onAddField: () => void;
  onUpdateField: (index: number, updates: Partial<FormField>) => void;
  onRemoveField: (index: number) => void;
  onImportFields: (fields: FormField[]) => void;
  onExportSchema: () => void;
}

export function FormFieldsSection({
  schema,
  onAddField,
  onUpdateField,
  onRemoveField,
  onImportFields,
  onExportSchema,
}: FormFieldsSectionProps) {
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
            No fields added yet. Click "Add Field" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
