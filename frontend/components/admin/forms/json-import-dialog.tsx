"use client";

import { useState } from "react";
import { Upload, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { FormField } from "@/lib/forms/types";
import { FORM_FIELD_TYPE_OPTIONS } from "@/lib/forms/field-types";
import { generateStableId } from "@/lib/utils/stable-id";

/** Schema-only import for simple forms (FormField[]). Card forms use Import card form / card-form-full-import-dialog. */
interface JsonImportDialogProps {
  onImport: (fields: FormField[]) => void;
}

const VALID_TYPES = FORM_FIELD_TYPE_OPTIONS.map((o) => o.value);

export function JsonImportDialog({ onImport }: JsonImportDialogProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const getExampleJSON = () => {
    return JSON.stringify(
      [
        {
          id: "name",
          type: "text",
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
        },
        {
          id: "message",
          type: "textarea",
          label: "Message",
          placeholder: "Enter your message",
          required: true,
        },
        {
          id: "service",
          type: "select",
          label: "Service Interest",
          options: ["Web Design", "SEO", "Marketing", "Consulting"],
          required: true,
        },
      ],
      null,
      2
    );
  };

  const importSchemaFromJSON = () => {
    try {
      const parsedSchema = JSON.parse(jsonInput);

      if (!Array.isArray(parsedSchema)) {
        throw new Error("JSON must be an array of form fields");
      }

      for (const field of parsedSchema) {
        if (!field.id || !field.type || !field.label) {
          throw new Error(
            "Each field must have id, type, and label properties"
          );
        }

        if (!VALID_TYPES.includes(field.type)) {
          throw new Error(
            `Invalid field type: ${field.type}. Valid types are: ${VALID_TYPES.join(", ")}`
          );
        }
      }

      const usedIds = new Set();
      const schemaWithUniqueIds = parsedSchema.map((field: FormField) => {
        let fieldId = field.id;
        if (!fieldId || usedIds.has(fieldId)) {
          fieldId = generateStableId("field");
        }
        usedIds.add(fieldId);
        return { ...field, id: fieldId };
      });

      onImport(schemaWithUniqueIds);
      setJsonInput("");
      setShowDialog(false);
      toast.success("Success", {
        description: `Imported ${schemaWithUniqueIds.length} form fields successfully`,
      });
    } catch (error: unknown) {
      toast.error("Import Error", {
        description:
          error instanceof Error ? error.message : "Invalid JSON format",
      });
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import Form Fields from JSON</DialogTitle>
          <DialogDescription>
            Paste your JSON schema below to bulk import form fields. This will
            replace existing fields.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="jsonInput">JSON Schema</Label>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON schema here..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setJsonInput(getExampleJSON())}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Load Example
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setJsonInput("");
                  setShowDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={importSchemaFromJSON}
                disabled={!jsonInput.trim()}
              >
                Import Fields
              </Button>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Expected JSON Format:</h4>
            <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border overflow-x-auto">
              {`[
  {
    "id": "field_id",
    "type": "text|textarea|select|checkbox|radio|file|image",
    "label": "Field Label",
    "placeholder": "Optional placeholder",
    "required": true|false,
    "options": ["Option 1", "Option 2"]  // For select/radio/checkbox
  }
]`}
            </pre>
            <p className="text-xs text-muted-foreground mt-1">
              Simple form schema only. For card forms use &quot;Import card
              form&quot; in the Card Builder.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
