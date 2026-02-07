"use client";

import { useCallback } from "react";
import type { FieldArrayPath } from "react-hook-form";
import { useWatch, useFormContext, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfileEstimation, FormField } from "@/lib/forms/types";
import { LabelWithTooltip } from "./label-with-tooltip";
import { PercentageConfig } from "./percentage-config";
import { CategoryConfig } from "./category-config";
import { MultiDimensionConfig } from "./multi-dimension-config";
import { RecommendationConfig } from "./recommendation-config";
import { AIConfig } from "./ai-config";
import { PROFILE_ESTIMATION_FIELD } from "./profile-estimation-form-types";
import type { FormTemplateFormValues } from "@/app/admin/(main)/forms/hooks/use-form-template-form-state";
import { generateStableId } from "@/lib/utils/stable-id";

const RESULT_TYPE_TOOLTIP =
  "Choose how the result is shown: Percentage (e.g. 0–100 with labels), Category (e.g. personality types), Multi-Dimension (several scores, e.g. bars/radar), or Recommendation (ranked items like products). Each type has its own config tab below.";
const TAB_PERCENTAGE_TOOLTIP =
  "Define score ranges (e.g. 0–30 Low, 31–70 Medium, 71–100 High) and how each form field's answers add points to the total percentage.";
const TAB_CATEGORY_TOOLTIP =
  "Define categories (e.g. The Adventurer, The Planner) and the conditions (which answers) match each category. The best-matching category is shown.";
const TAB_MULTI_DIMENSION_TOOLTIP =
  "Define multiple dimensions (e.g. Adventure, Relaxation), each with its own 0–max score. Configure how answers contribute points per dimension. Results can be shown as bars, radar, or pie.";
const TAB_RECOMMENDATION_TOOLTIP =
  "Define recommendations (e.g. products or tips) and the conditions that match each. Results are shown as a ranked list of matching items.";

export interface ProfileEstimationSetupProps {
  fields: FormField[];
}

/**
 * Profile Estimation setup UI. Uses parent form context (profileEstimation.*).
 * Must be rendered inside FormProvider from the form template page.
 */
export function ProfileEstimationSetup({
  fields,
}: ProfileEstimationSetupProps) {
  const form = useFormContext<FormTemplateFormValues>();
  const setValue = form.setValue;
  const getValues = form.getValues;

  const enabled = useWatch({
    control: form.control,
    name: `${PROFILE_ESTIMATION_FIELD}.enabled`,
    defaultValue: false,
  });
  const currentType = useWatch({
    control: form.control,
    name: `${PROFILE_ESTIMATION_FIELD}.type`,
    defaultValue: "percentage",
  });

  const categoriesPath =
    `${PROFILE_ESTIMATION_FIELD}.categoryConfig.categories` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: categories,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({ control: form.control, name: categoriesPath });
  const rangesPath =
    `${PROFILE_ESTIMATION_FIELD}.percentageConfig.ranges` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: ranges,
    append: appendRange,
    remove: removeRange,
  } = useFieldArray({ control: form.control, name: rangesPath });
  const fieldScoringPath =
    `${PROFILE_ESTIMATION_FIELD}.percentageConfig.fieldScoring` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: fieldScoring,
    append: appendFieldScoring,
    remove: removeFieldScoring,
  } = useFieldArray({ control: form.control, name: fieldScoringPath });
  const dimensionsPath =
    `${PROFILE_ESTIMATION_FIELD}.dimensionConfig.dimensions` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: dimensions,
    append: appendDimension,
    remove: removeDimension,
  } = useFieldArray({ control: form.control, name: dimensionsPath });
  const recommendationsPath =
    `${PROFILE_ESTIMATION_FIELD}.recommendationConfig.recommendations` as FieldArrayPath<FormTemplateFormValues>;
  const {
    fields: recommendations,
    append: appendRecommendation,
    remove: removeRecommendation,
  } = useFieldArray({ control: form.control, name: recommendationsPath });

  const handleEnabledChange = (checked: boolean) => {
    setValue(`${PROFILE_ESTIMATION_FIELD}.enabled`, checked, {
      shouldDirty: true,
    });
  };

  const handleTypeChange = (newType: ProfileEstimation["type"]) => {
    setValue(`${PROFILE_ESTIMATION_FIELD}.type`, newType, {
      shouldDirty: true,
    });
  };

  const onAddCategory = useCallback(() => {
    appendCategory({
      id: generateStableId("cat"),
      name: "",
      description: "",
      image: "",
      matchingLogic: undefined,
    });
  }, [appendCategory]);

  const onAddRange = useCallback(() => {
    const currentRanges =
      getValues(`${PROFILE_ESTIMATION_FIELD}.percentageConfig.ranges`) ?? [];
    const last = currentRanges[currentRanges.length - 1] as
      | { max?: number }
      | undefined;
    const lastMax = last?.max ?? 0;
    appendRange({
      min: lastMax + 1,
      max: lastMax + 10,
      label: "",
      description: "",
      image: "",
    });
  }, [appendRange, getValues]);

  const onAddFieldScoring = useCallback(() => {
    appendFieldScoring({
      fieldId: fields[0]?.id ?? "",
      scoring: [],
    });
  }, [appendFieldScoring, fields]);

  const onAddDimension = useCallback(() => {
    appendDimension({
      id: generateStableId("dim"),
      name: "",
      maxScore: 100,
      fields: [],
    });
  }, [appendDimension]);

  const onAddRecommendation = useCallback(() => {
    appendRecommendation({
      id: generateStableId("rec"),
      name: "",
      description: "",
      image: "",
      matchingCriteria: undefined,
    });
  }, [appendRecommendation]);

  if (!enabled) {
    return (
      <div className="space-y-4 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Profile Estimation</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Calculate personalized results based on user answers. Turn on to
              configure score ranges, categories, dimensions, or
              recommendations.
            </p>
          </div>
          <Switch checked={false} onCheckedChange={handleEnabledChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Profile Estimation</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate personalized results based on user answers
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
      </div>

      <div className="space-y-4">
        <div>
          <LabelWithTooltip
            label="Result Type"
            htmlFor="result-type"
            tooltip={RESULT_TYPE_TOOLTIP}
          />
          <Select value={currentType} onValueChange={handleTypeChange}>
            <SelectTrigger id="result-type" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage Score</SelectItem>
              <SelectItem value="category">Category/Personality</SelectItem>
              <SelectItem value="multi_dimension">Multi-Dimension</SelectItem>
              <SelectItem value="recommendation">Recommendation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t">
          <AIConfig fields={fields} />
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Use the tabs below to configure the result type you selected. Each
            tab has its own scoring and display options.
          </p>
          <Tabs value={currentType}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="percentage" title={TAB_PERCENTAGE_TOOLTIP}>
                Percentage
              </TabsTrigger>
              <TabsTrigger value="category" title={TAB_CATEGORY_TOOLTIP}>
                Category
              </TabsTrigger>
              <TabsTrigger
                value="multi_dimension"
                title={TAB_MULTI_DIMENSION_TOOLTIP}
              >
                Multi-Dimension
              </TabsTrigger>
              <TabsTrigger
                value="recommendation"
                title={TAB_RECOMMENDATION_TOOLTIP}
              >
                Recommendation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="percentage" className="mt-4">
              <PercentageConfig
                fields={fields}
                ranges={ranges}
                onAddRange={onAddRange}
                onRemoveRange={removeRange}
                fieldScoring={fieldScoring}
                onAddFieldScoring={onAddFieldScoring}
                onRemoveFieldScoring={removeFieldScoring}
              />
            </TabsContent>

            <TabsContent value="category" className="mt-4">
              <CategoryConfig
                fields={fields}
                categories={categories}
                onAddCategory={onAddCategory}
                onRemoveCategory={removeCategory}
              />
            </TabsContent>

            <TabsContent value="multi_dimension" className="mt-4">
              <MultiDimensionConfig
                fields={fields}
                dimensions={dimensions}
                onAddDimension={onAddDimension}
                onRemoveDimension={removeDimension}
              />
            </TabsContent>

            <TabsContent value="recommendation" className="mt-4">
              <RecommendationConfig
                fields={fields}
                recommendations={recommendations}
                onAddRecommendation={onAddRecommendation}
                onRemoveRecommendation={removeRecommendation}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
