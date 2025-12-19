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
import { useToast } from "@/hooks/use-toast";
import type { FormField } from "@/lib/api/endpoints/forms";

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Select Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
  { value: "file", label: "File Upload" },
  { value: "image", label: "Image Upload" },
];

interface JsonImportDialogProps {
  onImport: (fields: FormField[]) => void;
}

export function JsonImportDialog({ onImport }: JsonImportDialogProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

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
          id: "email",
          type: "email",
          label: "Email Address",
          placeholder: "Enter your email",
          required: true,
        },
        {
          id: "phone",
          type: "phone",
          label: "Phone Number",
          placeholder: "Enter your phone number",
          required: false,
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
      2,
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
            "Each field must have id, type, and label properties",
          );
        }

        const validTypes = fieldTypes.map((t) => t.value);
        if (!validTypes.includes(field.type)) {
          throw new Error(
            `Invalid field type: ${field.type}. Valid types are: ${validTypes.join(", ")}`,
          );
        }
      }

      const usedIds = new Set();
      const schemaWithUniqueIds = parsedSchema.map(
        (field: FormField, index: number) => {
          let fieldId = field.id;
          if (!fieldId || usedIds.has(fieldId)) {
            fieldId = `field_${Date.now()}_${index}`;
          }
          usedIds.add(fieldId);
          return { ...field, id: fieldId };
        },
      );

      onImport(schemaWithUniqueIds);
      setJsonInput("");
      setShowDialog(false);
      toast({
        title: "Success",
        description: `Imported ${schemaWithUniqueIds.length} form fields successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message || "Invalid JSON format",
        variant: "destructive",
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
    "type": "text|email|phone|textarea|select|checkbox|radio|file|image",
    "label": "Field Label",
    "placeholder": "Optional placeholder",
    "required": true|false,
    "options": ["Option 1", "Option 2"] // For select/radio only
  }
]`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
