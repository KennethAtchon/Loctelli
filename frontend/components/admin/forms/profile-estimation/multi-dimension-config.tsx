"use client";

import type { FieldArrayPath } from "react-hook-form";
import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

export interface MultiDimensionConfigProps {
  fields: FormField[];
  dimensions: Array<{ id: string }>;
  onAddDimension: () => void;
  onRemoveDimension: (index: number) => void;
}

export function MultiDimensionConfig({
  fields,
  dimensions,
  onAddDimension,
  onRemoveDimension,
}: MultiDimensionConfigProps) {
  const { control } = useFormContext<FormTemplateFormValues>();

  return (
    <div className="space-y-4">
      <Controller
        name={`${PROFILE_ESTIMATION_FIELD}.dimensionConfig.title`}
        control={control}
        render={({ field }) => (
          <div>
            <LabelWithTooltip
              label="Title"
              htmlFor="dimension-title"
              tooltip={
                'Heading on the result screen (e.g. "Your Profile", "Your scores").'
              }
            />
            <Input
              id="dimension-title"
              {...field}
              placeholder="Your Profile"
              className="mt-1.5"
            />
          </div>
        )}
      />
      <Controller
        name={`${PROFILE_ESTIMATION_FIELD}.dimensionConfig.visualization`}
        control={control}
        render={({ field }) => (
          <div>
            <LabelWithTooltip
              label="Visualization Type"
              htmlFor="visualization"
              tooltip="How to display the dimension scores: Bars (horizontal bars), Radar (spider chart), or Pie (pie chart)."
            />
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="visualization" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bars">Bars</SelectItem>
                <SelectItem value="radar">Radar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeadingWithTooltip tooltip="Each dimension is one axis (e.g. Adventure, Relaxation). For each dimension, set a name, max score, and which form fields contribute points to it. Scores are computed per dimension and shown with the visualization you chose.">
            <Label>Dimensions</Label>
          </SectionHeadingWithTooltip>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddDimension}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Dimension
          </Button>
        </div>
        {dimensions.map((dimension, dimIndex) => (
          <DimensionRow
            key={dimension.id}
            dimIndex={dimIndex}
            fields={fields}
            onRemove={() => onRemoveDimension(dimIndex)}
          />
        ))}
      </div>
    </div>
  );
}

function DimensionRow({
  dimIndex,
  fields,
  onRemove,
}: {
  dimIndex: number;
  fields: FormField[];
  onRemove: () => void;
}) {
  const { control, watch } = useFormContext<FormTemplateFormValues>();
  const dimensionFieldsPath =
    `${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.fields` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: fieldScoringList,
    append,
    remove,
  } = useFieldArray({
    control,
    name: dimensionFieldsPath,
  });
  const dimensionId =
    watch(
      `${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.id`
    ) ?? "";

  const addFieldScoring = () => {
    append({
      fieldId: fields[0]?.id ?? "",
      scoring: [],
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="grid grid-cols-3 gap-2">
        <Controller
          name={`${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.name`}
          control={control}
          render={({ field }) => (
            <div>
              <LabelWithTooltip
                label="Dimension Name"
                tooltip="Label for this axis (e.g. Adventure, Relaxation). Shown on the chart or bars."
              />
              <Input
                {...field}
                placeholder="e.g., Adventure"
                className="mt-1.5"
              />
            </div>
          )}
        />
        <Controller
          name={`${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.maxScore`}
          control={control}
          render={({ field }) => (
            <div>
              <LabelWithTooltip
                label="Max Score"
                tooltip="Maximum points for this dimension. User score will be between 0 and this value; the chart scales to it."
              />
              <Input
                type="number"
                value={field.value}
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value) || 100)
                }
                className="mt-1.5"
              />
            </div>
          )}
        />
        <div className="flex items-end">
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeadingWithTooltip tooltip="Pick form fields that contribute to this dimension. For each field, add scoring rules: answer value and points. Points are summed for this dimension only.">
            <Label className="text-sm">Field Scoring</Label>
          </SectionHeadingWithTooltip>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFieldScoring}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>
        {fieldScoringList.map((fieldScore, fieldIndex) => (
          <DimensionFieldScoringRow
            key={fieldScore.id}
            dimIndex={dimIndex}
            fieldIndex={fieldIndex}
            dimensionId={dimensionId}
            fields={fields}
            onRemove={() => remove(fieldIndex)}
          />
        ))}
      </div>
    </div>
  );
}

function DimensionFieldScoringRow({
  dimIndex,
  fieldIndex,
  dimensionId,
  fields,
  onRemove,
}: {
  dimIndex: number;
  fieldIndex: number;
  dimensionId: string;
  fields: FormField[];
  onRemove: () => void;
}) {
  const { control, watch } = useFormContext<FormTemplateFormValues>();
  const dimensionScoringPath =
    `${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.scoring` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: scoringRows,
    append,
    remove,
  } = useFieldArray({
    control,
    name: dimensionScoringPath,
  });

  const selectedField = fields.find(
    (f) =>
      f.id ===
      watch(
        `${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.fieldId`
      )
  );

  const addScoringRule = () => {
    if (selectedField?.options?.length) {
      selectedField.options.forEach((opt) => {
        append({ answer: opt, points: 0, dimension: dimensionId });
      });
    } else {
      append({ answer: "", points: 0, dimension: dimensionId });
    }
  };

  return (
    <div className="border rounded p-3 space-y-2 bg-background">
      <div className="flex items-center gap-2">
        <Controller
          name={`${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.fieldId`}
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
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2">
        {scoringRows.map((score, scoreIndex) => (
          <div key={score.id} className="flex items-center gap-2 text-sm">
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.scoring.${scoreIndex}.answer`}
              control={control}
              render={({ field }) => (
                <Input
                  value={String(field.value ?? "")}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Answer value"
                  className="flex-1"
                />
              )}
            />
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.scoring.${scoreIndex}.points`}
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
