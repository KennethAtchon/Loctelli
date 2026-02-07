"use client";

import { memo } from "react";
import {
  Controller,
  useController,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { LogicBuilder } from "@/components/admin/forms/card-form-builder/logic-builder";
import { getConditionsFromGroupOrBlock } from "@/lib/forms/conditional-logic";
import type { FormField, ScoringRule } from "@/lib/forms/types";

import {
  LabelWithTooltip,
  SectionHeadingWithTooltip,
} from "./label-with-tooltip";
import { PROFILE_ESTIMATION_FIELD } from "./profile-estimation-form-types";
import type { FormTemplateFormValues } from "@/app/admin/(main)/forms/hooks/use-form-template-form-state";

export interface CategoryConfigProps {
  fields: FormField[];
  categories: Array<{ id: string }>;
  onAddCategory: () => void;
  onRemoveCategory: (index: number) => void;
}

const CATEGORIES_PATH =
  `${PROFILE_ESTIMATION_FIELD}.categoryConfig.categories` as const;

// ============================================================================
// Input Components
// ============================================================================

const CategoryNameInput = memo(
  function CategoryNameInput({ index }: { index: number }) {
    const { control } = useFormContext<FormTemplateFormValues>();
    const { field } = useController({
      name: `${CATEGORIES_PATH}.${index}.name` as const,
      control,
    });

    return (
      <div>
        <LabelWithTooltip
          label="Category Name"
          htmlFor={`category-name-${index}`}
          tooltip="Display name for this category shown to the user (e.g. The Adventurer, The Planner)."
        />
        <Input
          id={`category-name-${index}`}
          {...field}
          placeholder="e.g., The Adventurer"
          className="mt-1.5"
        />
      </div>
    );
  },
  (prev, next) => prev.index === next.index
);

const CategoryDescriptionInput = memo(
  function CategoryDescriptionInput({ index }: { index: number }) {
    const { control } = useFormContext<FormTemplateFormValues>();
    const { field } = useController({
      name: `${CATEGORIES_PATH}.${index}.description` as const,
      control,
    });

    return (
      <div>
        <LabelWithTooltip
          label="Description"
          tooltip="Text shown when this category is the result (e.g. what this personality type means)."
        />
        <Textarea
          {...field}
          placeholder="Description of this category..."
          rows={3}
          className="mt-1.5"
        />
      </div>
    );
  },
  (prev, next) => prev.index === next.index
);

const CategoryImageInput = memo(
  function CategoryImageInput({ index }: { index: number }) {
    const { control } = useFormContext<FormTemplateFormValues>();
    const { field } = useController({
      name: `${CATEGORIES_PATH}.${index}.image` as const,
      control,
    });

    return (
      <div>
        <LabelWithTooltip
          label="Image URL (optional)"
          tooltip="URL of an image to display for this category (e.g. avatar or illustration)."
        />
        <Input
          {...field}
          value={field.value ?? ""}
          placeholder="https://example.com/image.jpg"
          className="mt-1.5"
        />
      </div>
    );
  },
  (prev, next) => prev.index === next.index
);

// ============================================================================
// Matching Logic Component
// ============================================================================

const MatchingLogicBlock = memo(
  function MatchingLogicBlock({
    index,
    fields,
  }: {
    index: number;
    fields: FormField[];
  }) {
    const { control } = useFormContext<FormTemplateFormValues>();
    const categoryName = useWatch({
      control,
      name: `${CATEGORIES_PATH}.${index}.name` as const,
      defaultValue: "",
    }) as string;

    return (
      <Controller
        name={`${CATEGORIES_PATH}.${index}.matchingLogic`}
        control={control}
        render={({ field }) => (
          <div>
            <LabelWithTooltip
              label="Matching Logic"
              tooltip={`Add conditions based on form fields (e.g. "Activity preference equals Hiking"). When the user's answers satisfy these conditions, this category is considered a match. You can use AND/OR groups. The best-matching category is shown.`}
            />
            <p className="text-xs text-muted-foreground mb-2 mt-1.5">
              Define conditions that match this category
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
              label={`Match conditions for "${categoryName || "Category"}"`}
            />
          </div>
        )}
      />
    );
  },
  (prev, next) => prev.index === next.index
);

// ============================================================================
// Category Row Component
// ============================================================================

const CategoryRow = memo(
  function CategoryRow({
    index,
    fields,
    onRemove,
  }: {
    index: number;
    fields: FormField[];
    onRemove: (index: number) => void;
  }) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <div className="grid grid-cols-2 gap-2">
          <CategoryNameInput index={index} />
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CategoryDescriptionInput index={index} />
        <CategoryImageInput index={index} />
        <MatchingLogicBlock index={index} fields={fields} />
      </div>
    );
  },
  (prev, next) =>
    prev.index === next.index &&
    prev.fields === next.fields &&
    prev.onRemove === next.onRemove
);

// ============================================================================
// Main Component
// ============================================================================

function CategoryConfigInner({
  fields,
  categories,
  onAddCategory,
  onRemoveCategory,
}: CategoryConfigProps) {
  const { control } = useFormContext<FormTemplateFormValues>();

  return (
    <div className="space-y-4">
      <Controller
        name={`${PROFILE_ESTIMATION_FIELD}.categoryConfig.title` as const}
        control={control}
        render={({ field }) => (
          <div>
            <LabelWithTooltip
              label="Title"
              htmlFor="category-title"
              tooltip='Heading on the result screen (e.g. "You are a...", "Your personality type").'
            />
            <Input
              id="category-title"
              {...field}
              placeholder="You are a..."
              className="mt-1.5"
            />
          </div>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeadingWithTooltip tooltip="Add one entry per outcome (e.g. The Adventurer, The Planner). For each category, set a name, description, optional image, and matching logic. The system picks the category whose conditions best match the user's answers.">
            <Label>Categories</Label>
          </SectionHeadingWithTooltip>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddCategory}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
        {categories.map((category, index) => (
          <CategoryRow
            key={category.id}
            index={index}
            fields={fields}
            onRemove={onRemoveCategory}
          />
        ))}
      </div>
    </div>
  );
}

const CategoryConfigComponent = memo(
  function CategoryConfigComponent(props: CategoryConfigProps) {
    return <CategoryConfigInner {...props} />;
  },
  (prev, next) =>
    prev.fields === next.fields &&
    prev.categories.length === next.categories.length &&
    prev.categories.every((c, i) => c.id === next.categories[i]?.id)
);

export const CategoryConfig = CategoryConfigComponent;
