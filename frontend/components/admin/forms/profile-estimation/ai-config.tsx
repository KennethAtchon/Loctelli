"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AIProfileConfig } from "@/lib/api";

export interface AIConfigProps {
  value?: AIProfileConfig;
  onChange: (config: AIProfileConfig | undefined) => void;
}

export function AIConfig({ value, onChange }: AIConfigProps) {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [model, setModel] = useState<"gpt-4" | "claude" | "custom">(
    value?.model || "gpt-4"
  );
  const [prompt, setPrompt] = useState(value?.prompt || "");
  const [analysisType, setAnalysisType] = useState<
    "sentiment" | "personality" | "recommendation"
  >(value?.analysisType || "personality");
  const [outputFormat, setOutputFormat] = useState<
    "percentage" | "category" | "freeform"
  >(value?.outputFormat || "category");

  useEffect(() => {
    if (value) {
      setEnabled(value.enabled);
      setModel(value.model || "gpt-4");
      setPrompt(value.prompt || "");
      setAnalysisType(value.analysisType || "personality");
      setOutputFormat(value.outputFormat || "category");
    }
  }, [value]);

  const handleEnabledChange = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (newEnabled) {
      onChange({
        enabled: true,
        model,
        prompt: prompt || getDefaultPrompt(analysisType, outputFormat),
        analysisType,
        outputFormat,
      });
    } else {
      onChange(undefined);
    }
  };

  const updateConfig = () => {
    if (enabled) {
      onChange({
        enabled: true,
        model,
        prompt: prompt || getDefaultPrompt(analysisType, outputFormat),
        analysisType,
        outputFormat,
      });
    }
  };

  const getDefaultPrompt = (
    type: typeof analysisType,
    format: typeof outputFormat
  ): string => {
    if (type === "sentiment") {
      return `Analyze the sentiment and emotional tone of the user's responses. Provide insights about their feelings, concerns, and overall attitude.`;
    }
    if (type === "personality") {
      return `Analyze the user's personality traits based on their answers. Identify key characteristics, preferences, and behavioral patterns.`;
    }
    if (type === "recommendation") {
      return `Based on the user's answers, provide personalized recommendations. Consider their preferences, needs, and responses to suggest the best options.`;
    }
    return `Analyze the user's responses and provide personalized insights.`;
  };

  if (!enabled) {
    return (
      <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center space-x-2">
          <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
          <Label className="cursor-pointer">Enable AI-powered analysis</Label>
        </div>
        <p className="text-xs text-muted-foreground ml-8">
          AI enhancement is optional. When disabled, results use rule-based
          scoring only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
        <Label className="cursor-pointer">Enable AI-powered analysis</Label>
      </div>

      <div className="space-y-4 pt-2">
        <div>
          <Label htmlFor="ai-model">AI Model</Label>
          <Select
            value={model}
            onValueChange={(val) => {
              setModel(val as typeof model);
              updateConfig();
            }}
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

        <div>
          <Label htmlFor="analysis-type">Analysis Type</Label>
          <Select
            value={analysisType}
            onValueChange={(val) => {
              setAnalysisType(val as typeof analysisType);
              const newPrompt = getDefaultPrompt(
                val as typeof analysisType,
                outputFormat
              );
              setPrompt(newPrompt);
              updateConfig();
            }}
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

        <div>
          <Label htmlFor="output-format">Output Format</Label>
          <Select
            value={outputFormat}
            onValueChange={(val) => {
              setOutputFormat(val as typeof outputFormat);
              const newPrompt = getDefaultPrompt(
                analysisType,
                val as typeof outputFormat
              );
              setPrompt(newPrompt);
              updateConfig();
            }}
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

        <div>
          <Label htmlFor="ai-prompt">Custom Prompt (Optional)</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              updateConfig();
            }}
            placeholder="Enter custom instructions for AI analysis..."
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Customize how the AI analyzes responses. Leave empty to use default
            prompts.
          </p>
        </div>
      </div>
    </div>
  );
}
