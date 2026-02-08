"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormField, FormFieldOption } from "@/lib/forms/types";
import { getOptionValue } from "@/lib/forms/option-utils";
import { FORM_FIELD_TYPE_OPTIONS } from "@/lib/forms/field-types";

type ImageOption = { value: string; imageUrl: string; altText?: string };

interface FormFieldEditorProps {
  field: FormField;
  index: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}

export function FormFieldEditor({
  field,
  index,
  onUpdate,
  onRemove,
}: FormFieldEditorProps) {
  const options = field.options ?? [];
  const optionDisplay = field.optionDisplay ?? "text";
  const isImageMode = optionDisplay === "image";
  const textOptions = isImageMode
    ? (options as ImageOption[]).map((o) => o.value)
    : (options as string[]);
  const imageOptions = isImageMode
    ? (options as ImageOption[])
    : (options as string[]).map((s) => ({ value: s || "", imageUrl: "", altText: s || "" }));

  const setDisplayMode = (mode: "text" | "image") => {
    if (mode === "image") {
      const converted = (options as FormFieldOption[]).map((o) =>
        typeof o === "string"
          ? { value: o || "Option", imageUrl: "", altText: o || "" }
          : o
      );
      onUpdate({ options: converted, optionDisplay: mode });
    } else {
      const converted = (options as FormFieldOption[]).map(getOptionValue);
      onUpdate({ options: converted, optionDisplay: mode });
    }
  };

  const addOption = () => {
    if (isImageMode) {
      onUpdate({
        options: [...(options as ImageOption[]), { value: "", imageUrl: "", altText: "" }],
      });
    } else {
      onUpdate({ options: [...(options as string[]), ""] });
    }
  };

  const updateTextOption = (optionIndex: number, value: string) => {
    const opts = options as string[];
    const updated = opts.map((v, i) => (i === optionIndex ? value : v));
    onUpdate({ options: updated });
  };

  const updateImageOption = (optionIndex: number, patch: Partial<ImageOption>) => {
    const opts = [...(options as ImageOption[])];
    opts[optionIndex] = { ...opts[optionIndex], ...patch };
    onUpdate({ options: opts });
  };

  const removeOption = (optionIndex: number) => {
    const updated = (isImageMode ? options as ImageOption[] : options as string[]).filter(
      (_, i) => i !== optionIndex
    );
    onUpdate({ options: updated });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-sm font-medium">Field {index + 1}</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value) =>
                onUpdate({ type: value as FormField["type"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_FIELD_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Field Label *</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Placeholder Text</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
            <Label>Required Field</Label>
          </div>
        </div>

        {(field.type === "select" ||
          field.type === "radio" ||
          field.type === "checkbox") && (
          <div className="space-y-3">
            <div>
              <Label>Options display</Label>
              <Select
                value={optionDisplay}
                onValueChange={(v) => setDisplayMode(v as "text" | "image")}
              >
                <SelectTrigger className="mt-1 max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Options</Label>
              <div className="space-y-2 mt-2">
                {!isImageMode &&
                  textOptions.map((opt, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateTextOption(optionIndex, e.target.value)
                        }
                        placeholder="Enter option"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(optionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                {isImageMode &&
                  imageOptions.map((opt, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex flex-col gap-2 p-3 border rounded-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Option {optionIndex + 1}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(optionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Value"
                        value={opt.value}
                        onChange={(e) =>
                          updateImageOption(optionIndex, {
                            value: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Image URL"
                        value={opt.imageUrl}
                        onChange={(e) =>
                          updateImageOption(optionIndex, {
                            imageUrl: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Alt text (optional)"
                        value={opt.altText ?? ""}
                        onChange={(e) =>
                          updateImageOption(optionIndex, {
                            altText: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
