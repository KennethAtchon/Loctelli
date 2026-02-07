"use client";

import type { FieldArrayPath } from "react-hook-form";
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
import {
  LabelWithTooltip,
  SectionHeadingWithTooltip,
} from "./label-with-tooltip";
import { PROFILE_ESTIMATION_FIELD } from "./profile-estimation-form-types";
import type { FormTemplateFormValues } from "@/app/admin/(main)/forms/hooks/use-form-template-form-state";

export interface PercentageConfigProps {
  fields: FormField[];
  ranges: Array<{ id: string }>;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  fieldScoring: Array<{ id: string }>;
  onAddFieldScoring: () => void;
  onRemoveFieldScoring: (index: number) => void;
}

export function PercentageConfig({
  fields,
  ranges,
  onAddRange,
  onRemoveRange,
  fieldScoring,
  onAddFieldScoring,
  onRemoveFieldScoring,
}: PercentageConfigProps) {
  const { control } = useFormContext<FormTemplateFormValues>();

  return (
    <div className="space-y-4">
      <Controller
        name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.title`}
        control={control}
        render={({ field }) => (
          <div>
            <LabelWithTooltip
              label="Title"
              htmlFor="percentage-title"
              tooltip={
                'Heading shown above the score on the result screen (e.g. "Your Score", "Compatibility").'
              }
            />
            <Input
              id="percentage-title"
              {...field}
              placeholder="Your Score"
              className="mt-1.5"
            />
          </div>
        )}
      />
      <Controller
        name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.description`}
        control={control}
        render={({ field }) => (
          <div>
            <LabelWithTooltip
              label="Description"
              htmlFor="percentage-description"
              tooltip={
                'Short text shown below the score to explain what it means (e.g. "Based on your answers...").'
              }
            />
            <Textarea
              id="percentage-description"
              {...field}
              placeholder="Based on your answers..."
              rows={3}
              className="mt-1.5"
            />
          </div>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeadingWithTooltip tooltip="Define bands for the total score (e.g. 0-30 Low, 31-70 Medium, 71-100 High). Each range can have a label, description, and optional image. Ranges should not overlap and typically cover 0-100.">
            <Label>Score Ranges</Label>
          </SectionHeadingWithTooltip>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddRange}
          >
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
                name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.ranges.${index}.min`}
                control={control}
                render={({ field }) => (
                  <div>
                    <LabelWithTooltip
                      label="Min %"
                      tooltip={
                        'Lowest percentage (0-100) that falls into this range. E.g. 0 for "0-30" or 31 for "31-70".'
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      className="mt-1.5"
                    />
                  </div>
                )}
              />
              <Controller
                name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.ranges.${index}.max`}
                control={control}
                render={({ field }) => (
                  <div>
                    <LabelWithTooltip
                      label="Max %"
                      tooltip={
                        'Highest percentage (0-100) for this range. E.g. 30 for "0-30" or 70 for "31-70".'
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 100)
                      }
                      className="mt-1.5"
                    />
                  </div>
                )}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRange(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.ranges.${index}.label`}
              control={control}
              render={({ field }) => (
                <div>
                  <LabelWithTooltip
                    label="Label"
                    tooltip="Short name for this range shown to the user (e.g. Low, Medium, High)."
                  />
                  <Input
                    {...field}
                    placeholder="e.g., Low, Medium, High"
                    className="mt-1.5"
                  />
                </div>
              )}
            />
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.ranges.${index}.description`}
              control={control}
              render={({ field }) => (
                <div>
                  <LabelWithTooltip
                    label="Description"
                    tooltip="Explanation shown for this score range on the result screen."
                  />
                  <Textarea
                    {...field}
                    placeholder="Description for this score range"
                    rows={2}
                    className="mt-1.5"
                  />
                </div>
              )}
            />
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.ranges.${index}.image`}
              control={control}
              render={({ field }) => (
                <div>
                  <LabelWithTooltip
                    label="Image URL (optional)"
                    tooltip="URL of an image to show for this range (e.g. illustration or badge)."
                  />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1.5"
                  />
                </div>
              )}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t">
        <SectionHeadingWithTooltip tooltip="For each form field, define how each answer option adds points. The percentage is: (sum of points for the user's chosen answers) ÷ (sum of each field's best possible points) × 100. So per field we use the highest point value as that field's maximum—e.g. if one question has 3 options worth 30, 40, 40, that field's max is 40, not 110. The result is always 0–100% and is then matched to your score ranges. Add one block per field, then add scoring rules: answer value and points.">
          <Label>Field Scoring Configuration</Label>
        </SectionHeadingWithTooltip>
        <p className="text-xs text-muted-foreground">
          Configure how answers contribute to the percentage score. Per field,
          the &quot;max&quot; is the highest point value among its options, not
          the sum of all options.
        </p>
        {fieldScoring.map((fieldScore, index) => (
          <PercentageFieldScoringRow
            key={fieldScore.id}
            index={index}
            fields={fields}
            onRemove={() => onRemoveFieldScoring(index)}
          />
        ))}
        <Button type="button" variant="outline" onClick={onAddFieldScoring}>
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
  const { control, watch } = useFormContext<FormTemplateFormValues>();
  const scoringPath =
    `${PROFILE_ESTIMATION_FIELD}.percentageConfig.fieldScoring.${index}.scoring` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: scoringRows,
    append,
    remove,
  } = useFieldArray({
    control,
    name: scoringPath,
  });

  const selectedField = fields.find(
    (f) =>
      f.id ===
      watch(
        `${PROFILE_ESTIMATION_FIELD}.percentageConfig.fieldScoring.${index}.fieldId`
      )
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
          name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.fieldScoring.${index}.fieldId`}
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
          <div key={score.id} className="flex items-center gap-2 text-sm">
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.fieldScoring.${index}.scoring.${scoreIndex}.answer`}
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
              name={`${PROFILE_ESTIMATION_FIELD}.percentageConfig.fieldScoring.${index}.scoring.${scoreIndex}.points`}
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
