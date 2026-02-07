"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { FormField, ScoringRule } from "@/lib/forms/types";
import { LogicBuilder } from "@/components/admin/forms/card-form-builder/logic-builder";
import { getConditionsFromGroupOrBlock } from "@/lib/forms/conditional-logic";
import {
  LabelWithTooltip,
  SectionHeadingWithTooltip,
} from "./label-with-tooltip";
import { PROFILE_ESTIMATION_FIELD } from "./profile-estimation-form-types";
import type { FormTemplateFormValues } from "@/app/admin/(main)/forms/hooks/use-form-template-form-state";

export interface RecommendationConfigProps {
  fields: FormField[];
  recommendations: Array<{ id: string }>;
  onAddRecommendation: () => void;
  onRemoveRecommendation: (index: number) => void;
}

export function RecommendationConfig({
  fields,
  recommendations,
  onAddRecommendation,
  onRemoveRecommendation,
}: RecommendationConfigProps) {
  const { control, watch } = useFormContext<FormTemplateFormValues>();

  return (
    <div className="space-y-4">
      <Controller
        name={`${PROFILE_ESTIMATION_FIELD}.recommendationConfig.title`}
        control={control}
        render={({ field }) => (
          <div>
            <LabelWithTooltip
              label="Title"
              htmlFor="recommendation-title"
              tooltip={
                'Heading on the result screen (e.g. "Perfect For You", "Recommended for you").'
              }
            />
            <Input
              id="recommendation-title"
              {...field}
              placeholder="Perfect For You"
              className="mt-1.5"
            />
          </div>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeadingWithTooltip tooltip="Add one entry per recommendation (e.g. a product or tip). For each, set name, description, optional image, and matching criteria. Users see a ranked list of items whose criteria match their answers.">
            <Label>Recommendations</Label>
          </SectionHeadingWithTooltip>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddRecommendation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recommendation
          </Button>
        </div>
        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-2">
              <Controller
                name={`${PROFILE_ESTIMATION_FIELD}.recommendationConfig.recommendations.${index}.name`}
                control={control}
                render={({ field }) => (
                  <div>
                    <LabelWithTooltip
                      label="Recommendation Name"
                      tooltip="Display name for this item (e.g. product name or tip title)."
                    />
                    <Input
                      {...field}
                      placeholder="e.g., Mountain Hiking Package"
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
                  onClick={() => onRemoveRecommendation(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.recommendationConfig.recommendations.${index}.description`}
              control={control}
              render={({ field }) => (
                <div>
                  <LabelWithTooltip
                    label="Description"
                    tooltip="Short text shown for this recommendation (e.g. product blurb or tip details)."
                  />
                  <Textarea
                    {...field}
                    placeholder="Description of this recommendation..."
                    rows={3}
                    className="mt-1.5"
                  />
                </div>
              )}
            />
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.recommendationConfig.recommendations.${index}.image`}
              control={control}
              render={({ field }) => (
                <div>
                  <LabelWithTooltip
                    label="Image URL (optional)"
                    tooltip="URL of an image for this recommendation (e.g. product image)."
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
            <Controller
              name={`${PROFILE_ESTIMATION_FIELD}.recommendationConfig.recommendations.${index}.matchingCriteria`}
              control={control}
              render={({ field }) => (
                <div>
                  <LabelWithTooltip
                    label="Matching Criteria"
                    tooltip="Add conditions based on form fields. When the user's answers satisfy these, this recommendation is included and ranked. Use AND/OR groups to combine conditions."
                  />
                  <p className="text-xs text-muted-foreground mb-2 mt-1.5">
                    Define conditions that match this recommendation
                  </p>
                  <LogicBuilder
                    fields={fields}
                    value={
                      (field.value ?? []).length > 0
                        ? {
                            operator: "AND",
                            conditions: (field.value ?? []).map((rule) => ({
                              fieldId: rule.fieldId,
                              operator: rule.operator,
                              value: rule.value,
                            })),
                          }
                        : undefined
                    }
                    onChange={(group) => {
                      const conditions = getConditionsFromGroupOrBlock(group);
                      const rules: ScoringRule[] = conditions.map((c) => ({
                        fieldId: c.fieldId,
                        operator: c.operator as ScoringRule["operator"],
                        value: c.value,
                        weight: 1,
                      }));
                      field.onChange(rules);
                    }}
                    label={`Match criteria for "${watch(`${PROFILE_ESTIMATION_FIELD}.recommendationConfig.recommendations.${index}.name`) || "Recommendation"}"`}
                  />
                </div>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
