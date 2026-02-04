"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { ProfileEstimation, FormField, ScoringRule } from "@/lib/api";
import { LogicBuilder } from "@/components/admin/forms/card-form-builder/logic-builder";

export interface RecommendationConfigProps {
  value?: ProfileEstimation["recommendationConfig"];
  fields: FormField[];
  onChange: (config: ProfileEstimation["recommendationConfig"]) => void;
}

export function RecommendationConfig({
  value,
  fields,
  onChange,
}: RecommendationConfigProps) {
  const [title, setTitle] = useState(value?.title || "");
  const [recommendations, setRecommendations] = useState(
    value?.recommendations || [
      {
        id: `rec_${Date.now()}`,
        name: "",
        description: "",
        image: "",
        matchingCriteria: [],
      },
    ]
  );

  const updateConfig = () => {
    onChange({
      title,
      recommendations: recommendations.map((rec) => ({
        ...rec,
        image: rec.image || undefined,
      })),
    });
  };

  const addRecommendation = () => {
    const newRecommendations = [
      ...recommendations,
      {
        id: `rec_${Date.now()}`,
        name: "",
        description: "",
        image: "",
        matchingCriteria: [],
      },
    ];
    setRecommendations(newRecommendations);
    onChange({
      title,
      recommendations: newRecommendations.map((rec) => ({
        ...rec,
        image: rec.image || undefined,
      })),
    });
  };

  const updateRecommendation = (
    index: number,
    updates: Partial<(typeof recommendations)[0]>
  ) => {
    const updated = recommendations.map((rec, i) =>
      i === index ? { ...rec, ...updates } : rec
    );
    setRecommendations(updated);
    onChange({
      title,
      recommendations: updated.map((rec) => ({
        ...rec,
        image: rec.image || undefined,
      })),
    });
  };

  const removeRecommendation = (index: number) => {
    const updated = recommendations.filter((_, i) => i !== index);
    setRecommendations(updated);
    onChange({
      title,
      recommendations: updated.map((rec) => ({
        ...rec,
        image: rec.image || undefined,
      })),
    });
  };

  const updateMatchingCriteria = (
    index: number,
    criteria: ScoringRule[] | undefined
  ) => {
    const updated = recommendations.map((rec, i) =>
      i === index
        ? {
            ...rec,
            matchingCriteria: criteria || [],
          }
        : rec
    );
    setRecommendations(updated);
    onChange({
      title,
      recommendations: updated.map((rec) => ({
        ...rec,
        image: rec.image || undefined,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recommendation-title">Title</Label>
        <Input
          id="recommendation-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            updateConfig();
          }}
          placeholder="Perfect For You"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Recommendations</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRecommendation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recommendation
          </Button>
        </div>

        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Recommendation Name</Label>
                <Input
                  value={recommendation.name}
                  onChange={(e) =>
                    updateRecommendation(index, { name: e.target.value })
                  }
                  placeholder="e.g., Mountain Hiking Package"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRecommendation(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={recommendation.description}
                onChange={(e) =>
                  updateRecommendation(index, { description: e.target.value })
                }
                placeholder="Description of this recommendation..."
                rows={3}
              />
            </div>

            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={recommendation.image || ""}
                onChange={(e) =>
                  updateRecommendation(index, { image: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label>Matching Criteria</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Define conditions that match this recommendation
              </p>
              <LogicBuilder
                fields={fields}
                value={
                  recommendation.matchingCriteria.length > 0
                    ? {
                        operator: "AND",
                        conditions: recommendation.matchingCriteria.map(
                          (rule) => ({
                            fieldId: rule.fieldId,
                            operator: rule.operator,
                            value: rule.value,
                          })
                        ),
                      }
                    : undefined
                }
                onChange={(group) => {
                  const rules: ScoringRule[] = group
                    ? group.conditions.map((c) => ({
                        fieldId: c.fieldId,
                        operator: c.operator as ScoringRule["operator"],
                        value: c.value,
                        weight: 1,
                      }))
                    : [];
                  updateMatchingCriteria(index, rules);
                }}
                label={`Match criteria for "${recommendation.name || "Recommendation"}"`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
