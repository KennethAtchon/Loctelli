"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type { ProfileEstimation, FormField, FieldScoring } from "@/lib/api";

export interface MultiDimensionConfigProps {
  value?: ProfileEstimation["dimensionConfig"];
  fields: FormField[];
  onChange: (config: ProfileEstimation["dimensionConfig"]) => void;
}

export function MultiDimensionConfig({
  value,
  fields,
  onChange,
}: MultiDimensionConfigProps) {
  const [title, setTitle] = useState(value?.title || "");
  const [visualization, setVisualization] = useState<"bars" | "radar" | "pie">(
    value?.visualization || "bars"
  );
  const [dimensions, setDimensions] = useState(
    value?.dimensions || [
      {
        id: `dim_${Date.now()}`,
        name: "",
        maxScore: 100,
        fields: [],
      },
    ]
  );

  const updateConfig = () => {
    onChange({
      title,
      visualization,
      dimensions,
    });
  };

  const addDimension = () => {
    const newDimensions = [
      ...dimensions,
      {
        id: `dim_${Date.now()}`,
        name: "",
        maxScore: 100,
        fields: [],
      },
    ];
    setDimensions(newDimensions);
    onChange({
      title,
      visualization,
      dimensions: newDimensions,
    });
  };

  const updateDimension = (
    index: number,
    updates: Partial<(typeof dimensions)[0]>
  ) => {
    const updated = dimensions.map((dim, i) =>
      i === index ? { ...dim, ...updates } : dim
    );
    setDimensions(updated);
    onChange({
      title,
      visualization,
      dimensions: updated,
    });
  };

  const removeDimension = (index: number) => {
    const updated = dimensions.filter((_, i) => i !== index);
    setDimensions(updated);
    onChange({
      title,
      visualization,
      dimensions: updated,
    });
  };

  const addFieldScoring = (dimIndex: number) => {
    const dimension = dimensions[dimIndex];
    const newFieldScoring: FieldScoring = {
      fieldId: fields[0]?.id || "",
      scoring: [],
    };
    const updated = dimensions.map((dim, i) =>
      i === dimIndex
        ? {
            ...dim,
            fields: [...dim.fields, newFieldScoring],
          }
        : dim
    );
    setDimensions(updated);
    onChange({
      title,
      visualization,
      dimensions: updated,
    });
  };

  const updateFieldScoring = (
    dimIndex: number,
    fieldIndex: number,
    updates: Partial<FieldScoring>
  ) => {
    const updated = dimensions.map((dim, i) =>
      i === dimIndex
        ? {
            ...dim,
            fields: dim.fields.map((f, fi) =>
              fi === fieldIndex ? { ...f, ...updates } : f
            ),
          }
        : dim
    );
    setDimensions(updated);
    onChange({
      title,
      visualization,
      dimensions: updated,
    });
  };

  const removeFieldScoring = (dimIndex: number, fieldIndex: number) => {
    const updated = dimensions.map((dim, i) =>
      i === dimIndex
        ? {
            ...dim,
            fields: dim.fields.filter((_, fi) => fi !== fieldIndex),
          }
        : dim
    );
    setDimensions(updated);
    onChange({
      title,
      visualization,
      dimensions: updated,
    });
  };

  const addScoringRule = (
    dimIndex: number,
    fieldIndex: number,
    answer: string | number,
    points: number
  ) => {
    const dimension = dimensions[dimIndex];
    const fieldScoring = dimension.fields[fieldIndex];
    const updated = dimensions.map((dim, i) =>
      i === dimIndex
        ? {
            ...dim,
            fields: dim.fields.map((f, fi) =>
              fi === fieldIndex
                ? {
                    ...f,
                    scoring: [
                      ...f.scoring,
                      { answer, points, dimension: dim.id },
                    ],
                  }
                : f
            ),
          }
        : dim
    );
    setDimensions(updated);
    onChange({
      title,
      visualization,
      dimensions: updated,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="dimension-title">Title</Label>
        <Input
          id="dimension-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            updateConfig();
          }}
          placeholder="Your Profile"
        />
      </div>

      <div>
        <Label htmlFor="visualization">Visualization Type</Label>
        <Select
          value={visualization}
          onValueChange={(val) => {
            setVisualization(val as typeof visualization);
            updateConfig();
          }}
        >
          <SelectTrigger id="visualization">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bars">Bars</SelectItem>
            <SelectItem value="radar">Radar Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Dimensions</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDimension}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Dimension
          </Button>
        </div>

        {dimensions.map((dimension, dimIndex) => (
          <div
            key={dimension.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Dimension Name</Label>
                <Input
                  value={dimension.name}
                  onChange={(e) =>
                    updateDimension(dimIndex, { name: e.target.value })
                  }
                  placeholder="e.g., Adventure"
                />
              </div>
              <div>
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={dimension.maxScore}
                  onChange={(e) =>
                    updateDimension(dimIndex, {
                      maxScore: parseInt(e.target.value) || 100,
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDimension(dimIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Field Scoring</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFieldScoring(dimIndex)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Field
                </Button>
              </div>

              {dimension.fields.map((fieldScoring, fieldIndex) => (
                <div
                  key={fieldIndex}
                  className="border rounded p-3 space-y-2 bg-background"
                >
                  <div className="flex items-center gap-2">
                    <Select
                      value={fieldScoring.fieldId}
                      onValueChange={(val) =>
                        updateFieldScoring(dimIndex, fieldIndex, {
                          fieldId: val,
                        })
                      }
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
                      onClick={() => removeFieldScoring(dimIndex, fieldIndex)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {fieldScoring.scoring.map((score, scoreIndex) => (
                      <div
                        key={scoreIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Input
                          value={String(score.answer)}
                          onChange={(e) => {
                            const updated = [...fieldScoring.scoring];
                            updated[scoreIndex] = {
                              ...updated[scoreIndex],
                              answer: e.target.value,
                            };
                            updateFieldScoring(dimIndex, fieldIndex, {
                              scoring: updated,
                            });
                          }}
                          placeholder="Answer value"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={score.points}
                          onChange={(e) => {
                            const updated = [...fieldScoring.scoring];
                            updated[scoreIndex] = {
                              ...updated[scoreIndex],
                              points: parseInt(e.target.value) || 0,
                            };
                            updateFieldScoring(dimIndex, fieldIndex, {
                              scoring: updated,
                            });
                          }}
                          placeholder="Points"
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = fieldScoring.scoring.filter(
                              (_, i) => i !== scoreIndex
                            );
                            updateFieldScoring(dimIndex, fieldIndex, {
                              scoring: updated,
                            });
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
                          (f) => f.id === fieldScoring.fieldId
                        );
                        if (
                          selectedField?.options &&
                          selectedField.options.length > 0
                        ) {
                          // Pre-fill with options
                          selectedField.options.forEach((opt) => {
                            addScoringRule(dimIndex, fieldIndex, opt, 0);
                          });
                        } else {
                          addScoringRule(dimIndex, fieldIndex, "", 0);
                        }
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Scoring Rule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
