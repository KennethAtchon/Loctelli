"use client";

import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
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
import { PercentageConfig } from "./percentage-config";
import { CategoryConfig } from "./category-config";
import { MultiDimensionConfig } from "./multi-dimension-config";
import { RecommendationConfig } from "./recommendation-config";
import { AIConfig } from "./ai-config";
import type { ProfileEstimationFormValues } from "./profile-estimation-form-types";
import {
  getDefaultFormValues,
  formValuesToProfileEstimation,
} from "./profile-estimation-form-utils";

export interface ProfileEstimationSetupProps {
  value?: ProfileEstimation;
  fields: FormField[];
  onChange: (config: ProfileEstimation | undefined) => void;
}

export function ProfileEstimationSetup({
  value,
  fields,
  onChange,
}: ProfileEstimationSetupProps) {
  const lastEmittedRef = useRef<ProfileEstimation | undefined>(undefined);

  const form = useForm<ProfileEstimationFormValues>({
    defaultValues: getDefaultFormValues(value),
    mode: "onChange",
  });

  const { reset, watch, getValues, formState } = form;
  const isDirty = formState.isDirty;

  // Sync from parent: reset when value changes from outside (e.g. load from API)
  useEffect(() => {
    if (value === undefined) {
      reset(getDefaultFormValues(undefined));
      lastEmittedRef.current = undefined;
      return;
    }
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    reset(getDefaultFormValues(value));
  }, [value, reset]);

  // Notify parent on every form change while dirty (subscription avoids stale closures)
  useEffect(() => {
    const subscription = watch((data) => {
      if (!form.formState.isDirty) return;
      const config = formValuesToProfileEstimation(
        data as ProfileEstimationFormValues
      );
      lastEmittedRef.current = config ?? undefined;
      onChange(config ?? undefined);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  const currentType = watch("type");
  const enabled = watch("enabled");

  const handleEnabledChange = (checked: boolean) => {
    form.setValue("enabled", checked, { shouldDirty: true });
    if (!checked) {
      lastEmittedRef.current = undefined;
      onChange(undefined);
    }
  };

  const handleTypeChange = (newType: ProfileEstimation["type"]) => {
    form.setValue("type", newType, { shouldDirty: true });
  };

  if (!enabled) {
    return (
      <div className="space-y-4 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Profile Estimation</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Calculate personalized results based on user answers
            </p>
          </div>
          <Switch checked={false} onCheckedChange={handleEnabledChange} />
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
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
            <Label htmlFor="result-type">Result Type</Label>
            <Select value={currentType} onValueChange={handleTypeChange}>
              <SelectTrigger id="result-type">
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

          <Tabs value={currentType} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="multi_dimension">Multi-Dimension</TabsTrigger>
              <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
            </TabsList>

            <TabsContent value="percentage" className="mt-4">
              <PercentageConfig fields={fields} />
            </TabsContent>

            <TabsContent value="category" className="mt-4">
              <CategoryConfig fields={fields} />
            </TabsContent>

            <TabsContent value="multi_dimension" className="mt-4">
              <MultiDimensionConfig fields={fields} />
            </TabsContent>

            <TabsContent value="recommendation" className="mt-4">
              <RecommendationConfig fields={fields} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FormProvider>
  );
}
