"use client";

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
import type { ProfileEstimationFormValues } from "./profile-estimation-form-types";

export interface MultiDimensionConfigProps {
  fields: FormField[];
}

export function MultiDimensionConfig({ fields }: MultiDimensionConfigProps) {
  const { control } = useFormContext<ProfileEstimationFormValues>();

  const { fields: dimensions, append, remove } = useFieldArray({
    control,
    name: "dimensionConfig.dimensions",
  });

  const addDimension = () => {
    append({
      id: `dim_${Date.now()}`,
      name: "",
      maxScore: 100,
      fields: [],
    });
  };

  return (
    <div className="space-y-4">
      <Controller
        name="dimensionConfig.title"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="dimension-title">Title</Label>
            <Input
              id="dimension-title"
              {...field}
              placeholder="Your Profile"
            />
          </div>
        )}
      />
      <Controller
        name="dimensionConfig.visualization"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="visualization">Visualization Type</Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="visualization">
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
          <Label>Dimensions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDimension}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dimension
          </Button>
        </div>
        {dimensions.map((dimension, dimIndex) => (
          <DimensionRow
            key={dimension.id}
            dimIndex={dimIndex}
            fields={fields}
            onRemove={() => remove(dimIndex)}
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
  const { control, watch } = useFormContext<ProfileEstimationFormValues>();
  const { fields: fieldScoringList, append, remove } = useFieldArray({
    control,
    name: `dimensionConfig.dimensions.${dimIndex}.fields`,
  });
  const dimensionId = watch(`dimensionConfig.dimensions.${dimIndex}.id`) ?? "";

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
          name={`dimensionConfig.dimensions.${dimIndex}.name`}
          control={control}
          render={({ field }) => (
            <div>
              <Label>Dimension Name</Label>
              <Input {...field} placeholder="e.g., Adventure" />
            </div>
          )}
        />
        <Controller
          name={`dimensionConfig.dimensions.${dimIndex}.maxScore`}
          control={control}
          render={({ field }) => (
            <div>
              <Label>Max Score</Label>
              <Input
                type="number"
                value={field.value}
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value) || 100)
                }
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
          <Label className="text-sm">Field Scoring</Label>
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
  const { control, watch } = useFormContext<ProfileEstimationFormValues>();
  const { fields: scoringRows, append, remove } = useFieldArray({
    control,
    name: `dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.scoring`,
  });

  const selectedField = fields.find(
    (f) =>
      f.id ===
      watch(
        `dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.fieldId`
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
          name={`dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.fieldId`}
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
              name={`dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.scoring.${scoreIndex}.answer`}
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
              name={`dimensionConfig.dimensions.${dimIndex}.fields.${fieldIndex}.scoring.${scoreIndex}.points`}
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
