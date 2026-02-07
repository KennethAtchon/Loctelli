"use client";

import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { FormField, ScoringRule } from "@/lib/forms/types";
import { LogicBuilder } from "@/components/admin/forms/card-form-builder/logic-builder";
import { getConditionsFromGroupOrBlock } from "@/lib/forms/conditional-logic";
import type { ProfileEstimationFormValues } from "./profile-estimation-form-types";

export interface RecommendationConfigProps {
  fields: FormField[];
}

export function RecommendationConfig({ fields }: RecommendationConfigProps) {
  const { control, watch } = useFormContext<ProfileEstimationFormValues>();

  const { fields: recommendations, append, remove } = useFieldArray({
    control,
    name: "recommendationConfig.recommendations",
  });

  const addRecommendation = () => {
    append({
      id: `rec_${Date.now()}`,
      name: "",
      description: "",
      image: "",
      matchingCriteria: [],
    });
  };

  return (
    <div className="space-y-4">
      <Controller
        name="recommendationConfig.title"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="recommendation-title">Title</Label>
            <Input
              id="recommendation-title"
              {...field}
              placeholder="Perfect For You"
            />
          </div>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Recommendations</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRecommendation}
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
                name={`recommendationConfig.recommendations.${index}.name`}
                control={control}
                render={({ field }) => (
                  <div>
                    <Label>Recommendation Name</Label>
                    <Input {...field} placeholder="e.g., Mountain Hiking Package" />
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
              name={`recommendationConfig.recommendations.${index}.description`}
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Description</Label>
                  <Textarea
                    {...field}
                    placeholder="Description of this recommendation..."
                    rows={3}
                  />
                </div>
              )}
            />
            <Controller
              name={`recommendationConfig.recommendations.${index}.image`}
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
            <Controller
              name={`recommendationConfig.recommendations.${index}.matchingCriteria`}
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Matching Criteria</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Define conditions that match this recommendation
                  </p>
                  <LogicBuilder
                    fields={fields}
                    value={
                      field.value.length > 0
                        ? {
                            operator: "AND",
                            conditions: field.value.map((rule) => ({
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
                    label={`Match criteria for "${watch(`recommendationConfig.recommendations.${index}.name`) || "Recommendation"}"`}
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
