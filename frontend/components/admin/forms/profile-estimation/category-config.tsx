"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { ProfileEstimation, FormField, ScoringRule } from "@/lib/api";
import { LogicBuilder } from "@/components/admin/forms/card-form-builder/logic-builder";

export interface CategoryConfigProps {
  value?: ProfileEstimation["categoryConfig"];
  fields: FormField[];
  onChange: (config: ProfileEstimation["categoryConfig"]) => void;
}

export function CategoryConfig({
  value,
  fields,
  onChange,
}: CategoryConfigProps) {
  const [title, setTitle] = useState(value?.title || "");
  const [categories, setCategories] = useState(
    value?.categories || [
      {
        id: `cat_${Date.now()}`,
        name: "",
        description: "",
        image: "",
        matchingLogic: [],
      },
    ]
  );

  const updateConfig = () => {
    onChange({
      title,
      categories: categories.map((cat) => ({
        ...cat,
        image: cat.image || undefined,
      })),
    });
  };

  const addCategory = () => {
    const newCategories = [
      ...categories,
      {
        id: `cat_${Date.now()}`,
        name: "",
        description: "",
        image: "",
        matchingLogic: [],
      },
    ];
    setCategories(newCategories);
    onChange({
      title,
      categories: newCategories.map((cat) => ({
        ...cat,
        image: cat.image || undefined,
      })),
    });
  };

  const updateCategory = (
    index: number,
    updates: Partial<(typeof categories)[0]>
  ) => {
    const updated = categories.map((cat, i) =>
      i === index ? { ...cat, ...updates } : cat
    );
    setCategories(updated);
    onChange({
      title,
      categories: updated.map((cat) => ({
        ...cat,
        image: cat.image || undefined,
      })),
    });
  };

  const removeCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
    onChange({
      title,
      categories: updated.map((cat) => ({
        ...cat,
        image: cat.image || undefined,
      })),
    });
  };

  const updateMatchingLogic = (
    index: number,
    logic: ScoringRule[] | undefined
  ) => {
    const updated = categories.map((cat, i) =>
      i === index
        ? {
            ...cat,
            matchingLogic: logic || [],
          }
        : cat
    );
    setCategories(updated);
    onChange({
      title,
      categories: updated.map((cat) => ({
        ...cat,
        image: cat.image || undefined,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category-title">Title</Label>
        <Input
          id="category-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            updateConfig();
          }}
          placeholder="You are a..."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Categories</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCategory}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {categories.map((category, index) => (
          <div
            key={category.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Category Name</Label>
                <Input
                  value={category.name}
                  onChange={(e) =>
                    updateCategory(index, { name: e.target.value })
                  }
                  placeholder="e.g., The Adventurer"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCategory(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={category.description}
                onChange={(e) =>
                  updateCategory(index, { description: e.target.value })
                }
                placeholder="Description of this category..."
                rows={3}
              />
            </div>

            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={category.image || ""}
                onChange={(e) =>
                  updateCategory(index, { image: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label>Matching Logic</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Define conditions that match this category
              </p>
              <LogicBuilder
                fields={fields}
                value={
                  category.matchingLogic.length > 0
                    ? {
                        operator: "AND",
                        conditions: category.matchingLogic.map((rule) => ({
                          fieldId: rule.fieldId,
                          operator: rule.operator,
                          value: rule.value,
                        })),
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
                  updateMatchingLogic(index, rules);
                }}
                label={`Match conditions for "${category.name || "Category"}"`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
