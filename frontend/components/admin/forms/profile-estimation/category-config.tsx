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

export interface CategoryConfigProps {
  fields: FormField[];
}

export function CategoryConfig({ fields }: CategoryConfigProps) {
  const { control, watch } = useFormContext<ProfileEstimationFormValues>();

  const { fields: categories, append, remove } = useFieldArray({
    control,
    name: "categoryConfig.categories",
  });

  const addCategory = () => {
    append({
      id: `cat_${Date.now()}`,
      name: "",
      description: "",
      image: "",
      matchingLogic: [],
    });
  };

  return (
    <div className="space-y-4">
      <Controller
        name="categoryConfig.title"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="category-title">Title</Label>
            <Input
              id="category-title"
              {...field}
              placeholder="You are a..."
            />
          </div>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Categories</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-2">
              <Controller
                name={`categoryConfig.categories.${index}.name`}
                control={control}
                render={({ field }) => (
                  <div>
                    <Label>Category Name</Label>
                    <Input {...field} placeholder="e.g., The Adventurer" />
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
              name={`categoryConfig.categories.${index}.description`}
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Description</Label>
                  <Textarea
                    {...field}
                    placeholder="Description of this category..."
                    rows={3}
                  />
                </div>
              )}
            />
            <Controller
              name={`categoryConfig.categories.${index}.image`}
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
              name={`categoryConfig.categories.${index}.matchingLogic`}
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Matching Logic</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Define conditions that match this category
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
                    label={`Match conditions for "${watch(`categoryConfig.categories.${index}.name`) || "Category"}"`}
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
