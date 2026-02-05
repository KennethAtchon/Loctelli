"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

export interface ProfileEstimationSetupProps {
  /** Current profile estimation configuration */
  value?: ProfileEstimation;
  /** All form fields (for scoring configuration) */
  fields: FormField[];
  /** Callback when configuration changes */
  onChange: (config: ProfileEstimation | undefined) => void;
}

export function ProfileEstimationSetup({
  value,
  fields,
  onChange,
}: ProfileEstimationSetupProps) {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [type, setType] = useState<ProfileEstimation["type"]>(
    value?.type || "percentage"
  );
  const [aiEnabled, setAiEnabled] = useState(value?.aiConfig?.enabled || false);

  useEffect(() => {
    if (value) {
      setEnabled(value.enabled);
      setType(value.type);
      setAiEnabled(value.aiConfig?.enabled || false);
    }
  }, [value]);

  const handleTypeChange = (newType: ProfileEstimation["type"]) => {
    setType(newType);
    // Reset config when type changes
    const baseConfig: ProfileEstimation = {
      enabled,
      type: newType,
      aiConfig: aiEnabled ? { enabled: true } : undefined,
    };
    onChange(baseConfig);
  };

  const handleConfigChange = (config: Partial<ProfileEstimation>) => {
    const updated: ProfileEstimation = {
      enabled,
      type,
      ...config,
      aiConfig: aiEnabled ? { enabled: true } : undefined,
    };
    onChange(updated);
  };

  const handleEnabledChange = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (newEnabled) {
      const baseConfig: ProfileEstimation = {
        enabled: true,
        type,
        aiConfig: aiEnabled ? { enabled: true } : undefined,
      };
      onChange(baseConfig);
    } else {
      onChange(undefined);
    }
  };

  const handleAiEnabledChange = (newAiEnabled: boolean) => {
    setAiEnabled(newAiEnabled);
    if (value) {
      handleConfigChange({
        aiConfig: newAiEnabled ? { enabled: true } : undefined,
      });
    }
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
          <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
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
          <Label htmlFor="result-type">Result Type</Label>
          <Select value={type} onValueChange={handleTypeChange}>
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
          <AIConfig
            value={value?.aiConfig}
            onChange={(config) => {
              handleConfigChange({ aiConfig: config });
              setAiEnabled(!!config?.enabled);
            }}
          />
        </div>

        <Tabs value={type} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="percentage">Percentage</TabsTrigger>
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="multi_dimension">Multi-Dimension</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          </TabsList>

          <TabsContent value="percentage" className="mt-4">
            <PercentageConfig
              value={value?.percentageConfig}
              fields={fields}
              onChange={(config) =>
                handleConfigChange({ percentageConfig: config })
              }
            />
          </TabsContent>

          <TabsContent value="category" className="mt-4">
            <CategoryConfig
              value={value?.categoryConfig}
              fields={fields}
              onChange={(config) =>
                handleConfigChange({ categoryConfig: config })
              }
            />
          </TabsContent>

          <TabsContent value="multi_dimension" className="mt-4">
            <MultiDimensionConfig
              value={value?.dimensionConfig}
              fields={fields}
              onChange={(config) =>
                handleConfigChange({ dimensionConfig: config })
              }
            />
          </TabsContent>

          <TabsContent value="recommendation" className="mt-4">
            <RecommendationConfig
              value={value?.recommendationConfig}
              fields={fields}
              onChange={(config) =>
                handleConfigChange({ recommendationConfig: config })
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
