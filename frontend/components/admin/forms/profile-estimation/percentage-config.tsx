"use client";

import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { FormField } from "@/lib/forms/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileEstimationFormValues } from "./profile-estimation-form-types";

export interface PercentageConfigProps {
  fields: FormField[];
}

export function PercentageConfig({ fields }: PercentageConfigProps) {
  const { control } = useFormContext<ProfileEstimationFormValues>();

  const { fields: ranges, append, remove } = useFieldArray({
    control,
    name: "percentageConfig.ranges",
  });

  const { fields: fieldScoring, append: appendFieldScoring, remove: removeFieldScoring } =
    useFieldArray({
      control,
      name: "percentageConfig.fieldScoring",
    });

  const addRange = () => {
    const last = ranges[ranges.length - 1];
    const lastMax = last ? (last as { max?: number }).max ?? 0 : 0;
    append({
      min: lastMax + 1,
      max: lastMax + 10,
      label: "",
      description: "",
      image: "",
    });
  };

  return (
    <div className="space-y-4">
      <Controller
        name="percentageConfig.title"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="percentage-title">Title</Label>
            <Input
              id="percentage-title"
              {...field}
              placeholder="Your Score"
            />
          </div>
        )}
      />
      <Controller
        name="percentageConfig.description"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="percentage-description">Description</Label>
            <Textarea
              id="percentage-description"
              {...field}
              placeholder="Based on your answers..."
              rows={3}
            />
          </div>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Score Ranges</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRange}>
            <Plus className="h-4 w-4 mr-2" />
            Add Range
          </Button>
        </div>
        {ranges.map((range, index) => (
          <div
            key={range.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            <div className="grid grid-cols-3 gap-2">
              <Controller
                name={`percentageConfig.ranges.${index}.min`}
                control={control}
                render={({ field }) => (
                  <div>
                    <Label>Min %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                )}
              />
              <Controller
                name={`percentageConfig.ranges.${index}.max`}
                control={control}
                render={({ field }) => (
                  <div>
                    <Label>Max %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 100)
                      }
                    />
                  </div>
                )}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Controller
              name={`percentageConfig.ranges.${index}.label`}
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Label</Label>
                  <Input {...field} placeholder="e.g., Low, Medium, High" />
                </div>
              )}
            />
            <Controller
              name={`percentageConfig.ranges.${index}.description`}
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Description</Label>
                  <Textarea
                    {...field}
                    placeholder="Description for this score range"
                    rows={2}
                  />
                </div>
              )}
            />
            <Controller
              name={`percentageConfig.ranges.${index}.image`}
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label>Field Scoring Configuration</Label>
        <p className="text-xs text-muted-foreground">
          Configure how answers contribute to the percentage score
        </p>
        {fieldScoring.map((fieldScore, index) => (
          <PercentageFieldScoringRow
            key={fieldScore.id}
            index={index}
            fields={fields}
            onRemove={() => removeFieldScoring(index)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendFieldScoring({
              fieldId: fields[0]?.id ?? "",
              scoring: [],
            })
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field Scoring
        </Button>
      </div>
    </div>
  );
}

function PercentageFieldScoringRow({
  index,
  fields,
  onRemove,
}: {
  index: number;
  fields: FormField[];
  onRemove: () => void;
}) {
  const { control, watch } = useFormContext<ProfileEstimationFormValues>();
  const { fields: scoringRows, append, remove } = useFieldArray({
    control,
    name: `percentageConfig.fieldScoring.${index}.scoring`,
  });

  const selectedField = fields.find(
    (f) => f.id === watch(`percentageConfig.fieldScoring.${index}.fieldId`)
  );

  const addScoringRule = () => {
    if (selectedField?.options?.length) {
      selectedField.options.forEach((opt) => {
        append({ answer: opt, points: 0 });
      });
    } else {
      append({ answer: "", points: 0 });
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
      <div className="flex items-center gap-2">
        <Controller
          name={`percentageConfig.fieldScoring.${index}.fieldId`}
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {scoringRows.map((score, scoreIndex) => (
          <div
            key={score.id}
            className="flex items-center gap-2 text-sm"
          >
        <Controller
          name={`percentageConfig.fieldScoring.${index}.scoring.${scoreIndex}.answer`}
          control={control}
              render={({ field }) => (
                <Input
                  value={
                    typeof field.value === "string"
                      ? field.value
                      : typeof field.value === "number"
                        ? String(field.value)
                        : Array.isArray(field.value)
                          ? field.value.join(", ")
                          : ""
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Answer value"
                  className="flex-1"
                />
              )}
            />
            <Controller
              name={`percentageConfig.fieldScoring.${index}.scoring.${scoreIndex}.points`}
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                  placeholder="Points"
                  className="w-24"
                />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(scoreIndex)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addScoringRule}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Scoring Rule
        </Button>
      </div>
    </div>
  );
}
