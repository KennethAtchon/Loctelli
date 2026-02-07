"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileEstimationFormValues } from "./profile-estimation-form-types";

export interface AIConfigProps {
  fields?: unknown;
}

export function AIConfig(_props: AIConfigProps) {
  const { control } = useFormContext<ProfileEstimationFormValues>();

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <Controller
        name="aiConfig.enabled"
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
            <Label className="cursor-pointer">Enable AI-powered analysis</Label>
          </div>
        )}
      />

      <Controller
        name="aiConfig.enabled"
        control={control}
        render={({ field: { value: enabled } }) =>
          !enabled ? (
            <p className="text-xs text-muted-foreground ml-8">
              AI enhancement is optional. When disabled, results use rule-based
              scoring only.
            </p>
          ) : (
            <></>
          )
        }
      />

      <Controller
        name="aiConfig.enabled"
        control={control}
        render={({ field: { value: enabled } }) =>
          !enabled ? (
            <></>
          ) : (
            <div className="space-y-4 pt-2">
              <Controller
                name="aiConfig.model"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="ai-model">AI Model</Label>
                    <Select
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v as ProfileEstimationFormValues["aiConfig"]["model"])
                      }
                    >
                      <SelectTrigger id="ai-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4 (OpenAI)</SelectItem>
                        <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="aiConfig.analysisType"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="analysis-type">Analysis Type</Label>
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger id="analysis-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                        <SelectItem value="personality">Personality Analysis</SelectItem>
                        <SelectItem value="recommendation">
                          Recommendation Engine
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="aiConfig.outputFormat"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="output-format">Output Format</Label>
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger id="output-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Score</SelectItem>
                        <SelectItem value="category">Category/Personality</SelectItem>
                        <SelectItem value="freeform">Freeform Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="aiConfig.prompt"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="ai-prompt">Custom Prompt (Optional)</Label>
                    <Textarea
                      id="ai-prompt"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Enter custom instructions for AI analysis..."
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Customize how the AI analyzes responses. Leave empty to
                      use default prompts.
                    </p>
                  </div>
                )}
              />
            </div>
          )
        }
      />
    </div>
  );
}
