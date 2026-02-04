"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import type {
  Condition,
  ConditionGroup,
  ConditionOperator,
  FormField,
} from "@/lib/api";

export interface LogicBuilderProps {
  /** All fields in the form (for reference in conditions) */
  fields: FormField[];
  /** Current conditional logic */
  value?: ConditionGroup;
  /** Callback when logic changes */
  onChange: (logic: ConditionGroup | undefined) => void;
  /** Label for the builder */
  label?: string;
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
];

export function LogicBuilder({
  fields,
  value,
  onChange,
  label = "Condition",
}: LogicBuilderProps) {
  const [group, setGroup] = useState<ConditionGroup>(
    value ?? { operator: "AND", conditions: [] }
  );

  useEffect(() => {
    if (value) {
      setGroup(value);
    }
  }, [value]);

  const updateGroup = (updates: Partial<ConditionGroup>) => {
    const updated = { ...group, ...updates };
    setGroup(updated);
    onChange(updated.conditions.length > 0 ? updated : undefined);
  };

  const addCondition = () => {
    const newCondition: Condition = {
      fieldId: fields[0]?.id || "",
      operator: "equals",
      value: "",
    };
    updateGroup({
      conditions: [...group.conditions, newCondition],
    });
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const updated = [...group.conditions];
    updated[index] = { ...updated[index], ...updates };
    updateGroup({ conditions: updated });
  };

  const removeCondition = (index: number) => {
    const updated = group.conditions.filter((_, i) => i !== index);
    updateGroup({ conditions: updated });
  };

  const getFieldOptions = (fieldId: string): string[] => {
    const field = fields.find((f) => f.id === fieldId);
    return field?.options || [];
  };

  const needsValue = (operator: ConditionOperator): boolean => {
    return !["is_empty", "is_not_empty"].includes(operator);
  };

  const renderConditionValue = (condition: Condition, index: number) => {
    const field = fields.find((f) => f.id === condition.fieldId);
    const fieldType = field?.type;
    const options = getFieldOptions(condition.fieldId);

    if (!needsValue(condition.operator)) {
      return null;
    }

    // For select/radio/checkbox, show dropdown
    if (
      fieldType &&
      ["select", "radio", "checkbox"].includes(fieldType) &&
      options.length > 0
    ) {
      return (
        <Select
          value={String(condition.value ?? "")}
          onValueChange={(val) => updateCondition(index, { value: val })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For number fields, use number input
    if (
      fieldType &&
      ["greater_than", "less_than"].includes(condition.operator)
    ) {
      return (
        <Input
          type="number"
          value={typeof condition.value === "number" ? condition.value : typeof condition.value === "string" ? condition.value : ""}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
          placeholder="Enter number"
          className="w-[180px]"
        />
      );
    }

    // Default: text input
    return (
      <Input
        type="text"
        value={typeof condition.value === "string" ? condition.value : typeof condition.value === "number" ? String(condition.value) : Array.isArray(condition.value) ? condition.value.join(", ") : ""}
        onChange={(e) => updateCondition(index, { value: e.target.value })}
        placeholder="Enter value"
        className="w-[180px]"
      />
    );
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {group.conditions.length > 0 && (
          <Select
            value={group.operator}
            onValueChange={(val) =>
              updateGroup({ operator: val as "AND" | "OR" })
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {group.conditions.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No conditions. Click "Add Condition" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {group.conditions.map((condition, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 border rounded-md bg-muted/30"
            >
              <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <Select
                  value={condition.fieldId}
                  onValueChange={(val) =>
                    updateCondition(index, { fieldId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields
                      .filter((f) => f.type !== "statement")
                      .map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label || field.id}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(val) =>
                    updateCondition(index, {
                      operator: val as ConditionOperator,
                    })
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {renderConditionValue(condition, index)}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addCondition}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>
    </div>
  );
}
