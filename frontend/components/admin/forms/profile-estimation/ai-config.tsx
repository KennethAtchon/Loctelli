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
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LabelWithTooltip } from "./label-with-tooltip";
import { PROFILE_ESTIMATION_FIELD } from "./profile-estimation-form-types";
import type { ProfileEstimationFormValues } from "./profile-estimation-form-types";
import type { FormTemplateFormValues } from "@/app/admin/(main)/forms/hooks/use-form-template-form-state";

const AI_SECTION_TOOLTIP =
  "Optionally use AI to refine the rule-based result (e.g. add natural-language insight or adjust the outcome). When disabled, only your configured rules and scoring are used. When enabled, the base result is sent to the chosen model for enhancement.";
const AI_MODEL_TOOLTIP =
  "Which AI provider to use for enhancement: GPT-4 (OpenAI), Claude (Anthropic), or Custom (your own endpoint). Requires corresponding API keys in settings.";
const ANALYSIS_TYPE_TOOLTIP =
  "How the AI should interpret answers: Sentiment (tone/emotion), Personality (traits/style), or Recommendation (suggestions). Affects the default prompt and output style.";
const OUTPUT_FORMAT_TOOLTIP =
  "Shape of the AI output: Percentage (score + explanation), Category (personality type + description), or Freeform (open text). Should align with your result type for best display.";
const CUSTOM_PROMPT_TOOLTIP =
  "Optional instructions sent to the AI (e.g. tone, what to emphasize, or extra context). Leave empty to use the default prompt for the chosen analysis type.";

export interface AIConfigProps {
  fields?: unknown;
}

export function AIConfig(_props: AIConfigProps) {
  const { control } = useFormContext<FormTemplateFormValues>();

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Controller
          name={`${PROFILE_ESTIMATION_FIELD}.aiConfig.enabled`}
          control={control}
          render={({ field }) => (
            <>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
              <Label className="cursor-pointer">
                Enable AI-powered analysis
              </Label>
            </>
          )}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="About AI enhancement"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-left">
            {AI_SECTION_TOOLTIP}
          </TooltipContent>
        </Tooltip>
      </div>

      <Controller
        name={`${PROFILE_ESTIMATION_FIELD}.aiConfig.enabled`}
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
        name={`${PROFILE_ESTIMATION_FIELD}.aiConfig.enabled`}
        control={control}
        render={({ field: { value: enabled } }) =>
          !enabled ? (
            <></>
          ) : (
            <div className="space-y-4 pt-2">
              <Controller
                name={`${PROFILE_ESTIMATION_FIELD}.aiConfig.model`}
                control={control}
                render={({ field }) => (
                  <div>
                    <LabelWithTooltip
                      label="AI Model"
                      htmlFor="ai-model"
                      tooltip={AI_MODEL_TOOLTIP}
                    />
                    <Select
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(
                          v as ProfileEstimationFormValues["aiConfig"]["model"]
                        )
                      }
                    >
                      <SelectTrigger id="ai-model" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4 (OpenAI)</SelectItem>
                        <SelectItem value="claude">
                          Claude (Anthropic)
                        </SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name={`${PROFILE_ESTIMATION_FIELD}.aiConfig.analysisType`}
                control={control}
                render={({ field }) => (
                  <div>
                    <LabelWithTooltip
                      label="Analysis Type"
                      htmlFor="analysis-type"
                      tooltip={ANALYSIS_TYPE_TOOLTIP}
                    />
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger id="analysis-type" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sentiment">
                          Sentiment Analysis
                        </SelectItem>
                        <SelectItem value="personality">
                          Personality Analysis
                        </SelectItem>
                        <SelectItem value="recommendation">
                          Recommendation Engine
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name={`${PROFILE_ESTIMATION_FIELD}.aiConfig.outputFormat`}
                control={control}
                render={({ field }) => (
                  <div>
                    <LabelWithTooltip
                      label="Output Format"
                      htmlFor="output-format"
                      tooltip={OUTPUT_FORMAT_TOOLTIP}
                    />
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger id="output-format" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          Percentage Score
                        </SelectItem>
                        <SelectItem value="category">
                          Category/Personality
                        </SelectItem>
                        <SelectItem value="freeform">Freeform Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name={`${PROFILE_ESTIMATION_FIELD}.aiConfig.prompt`}
                control={control}
                render={({ field }) => (
                  <div>
                    <LabelWithTooltip
                      label="Custom Prompt (Optional)"
                      htmlFor="ai-prompt"
                      tooltip={CUSTOM_PROMPT_TOOLTIP}
                    />
                    <Textarea
                      id="ai-prompt"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Enter custom instructions for AI analysis..."
                      rows={6}
                      className="font-mono text-sm mt-1.5"
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
