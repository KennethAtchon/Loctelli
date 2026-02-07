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
  ConditionBlock,
  ConditionGroup,
  ConditionOperator,
  FormField,
} from "@/lib/forms/types";
import { getPipingDisplayToken } from "@/lib/forms/conditional-logic";

function isConditionBlock(
  v: ConditionGroup | ConditionBlock | undefined
): v is ConditionBlock {
  return (
    v != null && "groups" in v && Array.isArray((v as ConditionBlock).groups)
  );
}

/** Normalize to block (single group → block with one group) */
function toBlock(
  value: ConditionGroup | ConditionBlock | undefined
): ConditionBlock {
  if (!value) return { operator: "AND", groups: [] };
  if (isConditionBlock(value)) return value;
  return { operator: value.operator, groups: [value] };
}

/** Emit: single group as ConditionGroup, multiple as ConditionBlock */
function fromBlock(
  block: ConditionBlock
): ConditionGroup | ConditionBlock | undefined {
  if (block.groups.length === 0) return undefined;
  if (block.groups.length === 1) return block.groups[0];
  return block;
}

export interface LogicBuilderProps {
  /** All fields in the form (for reference in conditions) */
  fields: FormField[];
  /** Current conditional logic (single group or group of groups) */
  value?: ConditionGroup | ConditionBlock;
  /** Callback when logic changes */
  onChange: (logic: ConditionGroup | ConditionBlock | undefined) => void;
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
  const [block, setBlock] = useState<ConditionBlock>(() => toBlock(value));

  useEffect(() => {
    setBlock(toBlock(value));
  }, [value]);

  const updateBlock = (updates: Partial<ConditionBlock>) => {
    const next = { ...block, ...updates };
    setBlock(next);
    onChange(fromBlock(next));
  };

  const updateGroupAt = (
    groupIndex: number,
    updates: Partial<ConditionGroup>
  ) => {
    const nextGroups = [...block.groups];
    nextGroups[groupIndex] = { ...nextGroups[groupIndex], ...updates };
    updateBlock({ groups: nextGroups });
  };

  const addGroup = () => {
    updateBlock({
      groups: [...block.groups, { operator: "AND", conditions: [] }],
    });
  };

  const removeGroupAt = (groupIndex: number) => {
    const nextGroups = block.groups.filter((_, i) => i !== groupIndex);
    updateBlock({ groups: nextGroups });
  };

  const addCondition = (groupIndex: number) => {
    const group = block.groups[groupIndex];
    const newCondition: Condition = {
      fieldId: fields[0]?.id || "",
      operator: "equals",
      value: "",
    };
    updateGroupAt(groupIndex, {
      conditions: [...group.conditions, newCondition],
    });
  };

  const updateCondition = (
    groupIndex: number,
    conditionIndex: number,
    updates: Partial<Condition>
  ) => {
    const group = block.groups[groupIndex];
    const updated = [...group.conditions];
    updated[conditionIndex] = { ...updated[conditionIndex], ...updates };
    updateGroupAt(groupIndex, { conditions: updated });
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const group = block.groups[groupIndex];
    const updated = group.conditions.filter((_, i) => i !== conditionIndex);
    updateGroupAt(groupIndex, { conditions: updated });
  };

  const getFieldOptions = (fieldId: string): string[] => {
    const field = fields.find((f) => f.id === fieldId);
    return field?.options || [];
  };

  const needsValue = (operator: ConditionOperator): boolean => {
    return !["is_empty", "is_not_empty"].includes(operator);
  };

  const renderConditionValue = (
    groupIndex: number,
    condition: Condition,
    conditionIndex: number
  ) => {
    const field = fields.find((f) => f.id === condition.fieldId);
    const fieldType = field?.type;
    const options = getFieldOptions(condition.fieldId);

    if (!needsValue(condition.operator)) {
      return null;
    }

    if (
      fieldType &&
      ["select", "radio", "checkbox"].includes(fieldType) &&
      options.length > 0
    ) {
      return (
        <Select
          value={String(condition.value ?? "")}
          onValueChange={(val) =>
            updateCondition(groupIndex, conditionIndex, { value: val })
          }
        >
          <SelectTrigger className="w-[180px] min-w-0">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt} title={opt} className="min-w-0">
                <span className="truncate block max-w-[160px] text-left">
                  {opt}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (
      fieldType &&
      ["greater_than", "less_than"].includes(condition.operator)
    ) {
      return (
        <Input
          type="number"
          value={
            typeof condition.value === "number"
              ? condition.value
              : typeof condition.value === "string"
                ? condition.value
                : ""
          }
          onChange={(e) =>
            updateCondition(groupIndex, conditionIndex, {
              value: e.target.value,
            })
          }
          placeholder="Enter number"
          className="w-[180px]"
        />
      );
    }

    return (
      <Input
        type="text"
        value={
          typeof condition.value === "string"
            ? condition.value
            : typeof condition.value === "number"
              ? String(condition.value)
              : Array.isArray(condition.value)
                ? condition.value.join(", ")
                : ""
        }
        onChange={(e) =>
          updateCondition(groupIndex, conditionIndex, { value: e.target.value })
        }
        placeholder="Enter value"
        className="w-[180px]"
      />
    );
  };

  const conditionFields = fields.filter((f) => f.type !== "statement");

  return (
    <div className="space-y-4 border rounded-lg p-4">
      {block.groups.length > 1 && (
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs">
            Match{" "}
            <Select
              value={block.operator}
              onValueChange={(val) =>
                updateBlock({ operator: val as "AND" | "OR" })
              }
            >
              <SelectTrigger className="w-[100px] inline-flex h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">all</SelectItem>
                <SelectItem value="OR">any</SelectItem>
              </SelectContent>
            </Select>{" "}
            of the following groups
          </Label>
        </div>
      )}

      {block.groups.length === 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground text-center py-4">
            No conditions. Add a group to get started.
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addGroup}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add group
          </Button>
        </div>
      ) : (
        <>
          {block.groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="rounded-md border bg-muted/20 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                {label && (
                  <Label className="text-xs">
                    {block.groups.length > 1
                      ? `Group ${groupIndex + 1}`
                      : label}
                  </Label>
                )}
                <div className="flex items-center gap-2">
                  {group.conditions.length > 0 && (
                    <Select
                      value={group.operator}
                      onValueChange={(val) =>
                        updateGroupAt(groupIndex, {
                          operator: val as "AND" | "OR",
                        })
                      }
                    >
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {block.groups.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGroupAt(groupIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {group.conditions.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No conditions in this group.
                </div>
              ) : (
                <div className="space-y-2">
                  {group.conditions.map((condition, condIdx) => (
                    <div
                      key={condIdx}
                      className="flex items-start gap-2 p-2 border rounded bg-background"
                    >
                      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center min-w-0">
                        <Select
                          value={condition.fieldId}
                          onValueChange={(val) =>
                            updateCondition(groupIndex, condIdx, {
                              fieldId: val,
                            })
                          }
                        >
                          <SelectTrigger className="min-w-0 max-w-[220px]">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionFields.map((field) => {
                              const displayLabel = field.label || "(No label)";
                              return (
                                <SelectItem
                                  key={field.id}
                                  value={field.id}
                                  title={displayLabel}
                                >
                                  <div className="flex flex-col items-start gap-0.5 min-w-0 max-w-[260px] overflow-hidden">
                                    <span className="truncate block text-left">
                                      {displayLabel}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono truncate block text-left">
                                      {"{{"}
                                      {getPipingDisplayToken(field)}
                                      {"}}"}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(val) =>
                            updateCondition(groupIndex, condIdx, {
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

                        {renderConditionValue(groupIndex, condition, condIdx)}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(groupIndex, condIdx)}
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
                size="sm"
                onClick={() => addCondition(groupIndex)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add condition
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addGroup}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add group
          </Button>
        </>
      )}
    </div>
  );
}
