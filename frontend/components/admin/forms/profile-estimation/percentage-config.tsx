"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type {
  ProfileEstimation,
  FormField,
  FieldScoring,
} from "@/lib/forms/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PercentageConfigProps {
  value?: ProfileEstimation["percentageConfig"];
  fields: FormField[];
  onChange: (config: ProfileEstimation["percentageConfig"]) => void;
}

export function PercentageConfig({
  value,
  fields,
  onChange,
}: PercentageConfigProps) {
  const [title, setTitle] = useState(value?.title || "");
  const [description, setDescription] = useState(value?.description || "");
  const [ranges, setRanges] = useState(
    value?.ranges || [
      { min: 0, max: 33, label: "Low", description: "", image: "" },
      { min: 34, max: 66, label: "Medium", description: "", image: "" },
      { min: 67, max: 100, label: "High", description: "", image: "" },
    ]
  );
  const [fieldScoring, setFieldScoring] = useState<FieldScoring[]>(
    value?.fieldScoring || []
  );

  useEffect(() => {
    if (value?.fieldScoring) {
      setFieldScoring(value.fieldScoring);
    }
    if (value?.title) setTitle(value.title);
    if (value?.description) setDescription(value.description);
    if (value?.ranges) setRanges(value.ranges);
  }, [value]);

  const updateConfig = () => {
    onChange({
      title,
      description,
      fieldScoring: fieldScoring.length > 0 ? fieldScoring : undefined,
      ranges: ranges.map((r) => ({
        ...r,
        image: r.image || undefined,
      })),
    });
  };

  const addRange = () => {
    const newRanges = [
      ...ranges,
      {
        min: ranges.length > 0 ? ranges[ranges.length - 1].max + 1 : 0,
        max: ranges.length > 0 ? ranges[ranges.length - 1].max + 10 : 10,
        label: "",
        description: "",
        image: "",
      },
    ];
    setRanges(newRanges);
    onChange({
      title,
      description,
      ranges: newRanges.map((r) => ({
        ...r,
        image: r.image || undefined,
      })),
    });
  };

  const updateRange = (index: number, updates: Partial<(typeof ranges)[0]>) => {
    const updated = ranges.map((r, i) =>
      i === index ? { ...r, ...updates } : r
    );
    setRanges(updated);
    onChange({
      title,
      description,
      fieldScoring: fieldScoring.length > 0 ? fieldScoring : undefined,
      ranges: updated.map((r) => ({
        ...r,
        image: r.image || undefined,
      })),
    });
  };

  const removeRange = (index: number) => {
    const updated = ranges.filter((_, i) => i !== index);
    setRanges(updated);
    onChange({
      title,
      description,
      fieldScoring: fieldScoring.length > 0 ? fieldScoring : undefined,
      ranges: updated.map((r) => ({
        ...r,
        image: r.image || undefined,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="percentage-title">Title</Label>
        <Input
          id="percentage-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onChange({
              title: e.target.value,
              description,
              fieldScoring: fieldScoring.length > 0 ? fieldScoring : undefined,
              ranges: ranges.map((r) => ({
                ...r,
                image: r.image || undefined,
              })),
            });
          }}
          placeholder="Your Score"
        />
      </div>

      <div>
        <Label htmlFor="percentage-description">Description</Label>
        <Textarea
          id="percentage-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onChange({
              title,
              description: e.target.value,
              fieldScoring: fieldScoring.length > 0 ? fieldScoring : undefined,
              ranges: ranges.map((r) => ({
                ...r,
                image: r.image || undefined,
              })),
            });
          }}
          placeholder="Based on your answers..."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Score Ranges</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRange}>
            <Plus className="h-4 w-4 mr-2" />
            Add Range
          </Button>
        </div>

        {ranges.map((range, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Min %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={range.min}
                  onChange={(e) =>
                    updateRange(index, { min: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>Max %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={range.max}
                  onChange={(e) =>
                    updateRange(index, { max: parseInt(e.target.value) || 100 })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRange(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Label</Label>
              <Input
                value={range.label}
                onChange={(e) => updateRange(index, { label: e.target.value })}
                placeholder="e.g., Low, Medium, High"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={range.description}
                onChange={(e) =>
                  updateRange(index, { description: e.target.value })
                }
                placeholder="Description for this score range"
                rows={2}
              />
            </div>

            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={range.image || ""}
                onChange={(e) => updateRange(index, { image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label>Field Scoring Configuration</Label>
        <p className="text-xs text-muted-foreground">
          Configure how answers contribute to the percentage score
        </p>
        {fieldScoring.map((fieldScore, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 space-y-2 bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <Select
                value={fieldScore.fieldId}
                onValueChange={(val) => {
                  const updated = [...fieldScoring];
                  updated[index] = { ...updated[index], fieldId: val };
                  setFieldScoring(updated);
                  updateConfig();
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const updated = fieldScoring.filter((_, i) => i !== index);
                  setFieldScoring(updated);
                  updateConfig();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {fieldScore.scoring.map((score, scoreIndex) => (
                <div
                  key={scoreIndex}
                  className="flex items-center gap-2 text-sm"
                >
                  <Input
                    value={
                      typeof score.answer === "string"
                        ? score.answer
                        : typeof score.answer === "number"
                          ? String(score.answer)
                          : Array.isArray(score.answer)
                            ? score.answer.join(", ")
                            : ""
                    }
                    onChange={(e) => {
                      const updated = [...fieldScore.scoring];
                      updated[scoreIndex] = {
                        ...updated[scoreIndex],
                        answer: e.target.value,
                      };
                      const fieldScoringUpdated = [...fieldScoring];
                      fieldScoringUpdated[index] = {
                        ...fieldScoringUpdated[index],
                        scoring: updated,
                      };
                      setFieldScoring(fieldScoringUpdated);
                      updateConfig();
                    }}
                    placeholder="Answer value"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={score.points}
                    onChange={(e) => {
                      const updated = [...fieldScore.scoring];
                      updated[scoreIndex] = {
                        ...updated[scoreIndex],
                        points: parseInt(e.target.value) || 0,
                      };
                      const fieldScoringUpdated = [...fieldScoring];
                      fieldScoringUpdated[index] = {
                        ...fieldScoringUpdated[index],
                        scoring: updated,
                      };
                      setFieldScoring(fieldScoringUpdated);
                      updateConfig();
                    }}
                    placeholder="Points"
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated = fieldScore.scoring.filter(
                        (_, i) => i !== scoreIndex
                      );
                      const fieldScoringUpdated = [...fieldScoring];
                      fieldScoringUpdated[index] = {
                        ...fieldScoringUpdated[index],
                        scoring: updated,
                      };
                      setFieldScoring(fieldScoringUpdated);
                      updateConfig();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedField = fields.find(
                    (f) => f.id === fieldScore.fieldId
                  );
                  const updated = [...fieldScore.scoring];
                  if (
                    selectedField?.options &&
                    selectedField.options.length > 0
                  ) {
                    selectedField.options.forEach((opt) => {
                      updated.push({ answer: opt, points: 0 });
                    });
                  } else {
                    updated.push({ answer: "", points: 0 });
                  }
                  const fieldScoringUpdated = [...fieldScoring];
                  fieldScoringUpdated[index] = {
                    ...fieldScoringUpdated[index],
                    scoring: updated,
                  };
                  setFieldScoring(fieldScoringUpdated);
                  updateConfig();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Scoring Rule
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const newFieldScoring: FieldScoring = {
              fieldId: fields[0]?.id || "",
              scoring: [],
            };
            setFieldScoring([...fieldScoring, newFieldScoring]);
            updateConfig();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field Scoring
        </Button>
      </div>
    </div>
  );
}
