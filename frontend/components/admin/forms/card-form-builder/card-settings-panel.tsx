"use client";

import { useState, useMemo } from "react";
import type { Path } from "react-hook-form";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2, Info, ChevronDown, Plus } from "lucide-react";
import type {
  FlowchartNode,
  FlowchartNodeData,
} from "@/lib/forms/flowchart-types";
import type {
  FormField,
  FormFieldOption,
  ConditionGroup,
  ConditionBlock,
} from "@/lib/forms/types";
import { getOptionValue } from "@/lib/forms/option-utils";
import { getPipingDisplayToken } from "@/lib/forms/conditional-logic";
import {
  FORM_FIELD_TYPE_OPTIONS,
  fieldTypeHasOptions,
} from "@/lib/forms/field-types";
import { labelToPipingKey } from "@/lib/forms/form-utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LogicBuilder } from "./logic-builder";
import type { NodeSettingsFormValues } from "./card-settings-panel-form-types";
import { defaultMediaFormValues } from "./card-settings-panel-form-types";
import { generateStableId } from "@/lib/utils/stable-id";
import type { FormTemplateFormValues } from "@/app/admin/(main)/forms/hooks/use-form-template-form-state";

function hasAnyConditions(
  logic: ConditionGroup | ConditionBlock | undefined
): boolean {
  if (!logic) return false;
  if ("groups" in logic) {
    return logic.groups.some((g) => g.conditions.length > 0);
  }
  return logic.conditions.length > 0;
}

const dummyNode = {
  id: "",
  type: "question" as const,
  data: {},
  position: { x: 0, y: 0 },
} as FlowchartNode;

export interface CardSettingsPanelProps {
  node: FlowchartNode | null;
  /** Index of the node in the parent form's cardSettings.flowchartGraph.nodes array. */
  nodeIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (nodeId: string) => void;
  formSlug?: string;
  allFields?: FormField[];
}

export function CardSettingsPanel({
  node,
  nodeIndex,
  open,
  onOpenChange,
  onDelete,
  formSlug,
  allFields = [],
}: CardSettingsPanelProps) {
  const { control, setValue, getValues, watch } =
    useFormContext<FormTemplateFormValues>();
  const pathPrefix = useMemo(
    () =>
      nodeIndex >= 0
        ? `cardSettings.flowchartGraph.nodes.${nodeIndex}.data`
        : "",
    [nodeIndex]
  );

  const { toast } = useToast();
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newOption, setNewOption] = useState("");

  const handleMediaUpload = async (file: File) => {
    if (!formSlug) {
      toast({
        title: "Form Not Saved",
        description:
          "Please save the form first before uploading files. You can use a URL instead, or save the form and try again.",
        variant: "destructive",
      });
      return;
    }
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "fieldId",
        `media_${node?.id ?? generateStableId("media")}`
      );
      const result = await api.forms.uploadAdminFile(formSlug, formData);
      const current = getValues(
        `${pathPrefix}.media` as Path<FormTemplateFormValues>
      ) as typeof defaultMediaFormValues | undefined;
      setValue(
        `${pathPrefix}.media` as Path<FormTemplateFormValues>,
        current
          ? { ...current, url: result.url }
          : { ...defaultMediaFormValues, url: result.url },
        { shouldDirty: true }
      );
      toast({ title: "Success", description: "Media uploaded successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  if (!node || nodeIndex < 0) return null;

  const isQuestion = node.type === "question";
  const isStatement = node.type === "statement";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isStatement ? "Statement Settings" : "Question Settings"}
          </DialogTitle>
          <DialogDescription>
            Configure this card&apos;s content and behavior
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onOpenChange(false);
          }}
          className="space-y-6 mt-6 p-6 pt-4"
        >
          {isStatement ? (
            <>
              <Controller
                name={
                  `${pathPrefix}.statementText` as Path<FormTemplateFormValues>
                }
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="statement-text">Statement Text</Label>
                    <Textarea
                      id="statement-text"
                      {...field}
                      value={String(field.value ?? "")}
                      placeholder="Enter the statement text..."
                      rows={4}
                    />
                  </div>
                )}
              />
              <Controller
                name={
                  `${pathPrefix}.isSuccessCard` as Path<FormTemplateFormValues>
                }
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-success-card"
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="is-success-card">
                      Show this card after form submission
                    </Label>
                  </div>
                )}
              />
            </>
          ) : (
            <>
              <Controller
                name={`${pathPrefix}.fieldType` as Path<FormTemplateFormValues>}
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="field-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORM_FIELD_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name={`${pathPrefix}.label` as Path<FormTemplateFormValues>}
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="label">Question Label *</Label>
                    <Input
                      id="label"
                      {...field}
                      value={String(field.value ?? "")}
                      placeholder="What is your name?"
                    />
                  </div>
                )}
              />
              <Controller
                name={`${pathPrefix}.fieldType` as Path<FormTemplateFormValues>}
                control={control}
                render={({ field: { value: fieldType } }) =>
                  fieldType !== "checkbox" ? (
                    <Controller
                      name={
                        `${pathPrefix}.placeholder` as Path<FormTemplateFormValues>
                      }
                      control={control}
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="placeholder">Placeholder</Label>
                          <Input
                            id="placeholder"
                            {...field}
                            value={String(field.value ?? "")}
                            placeholder="Enter placeholder text..."
                          />
                        </div>
                      )}
                    />
                  ) : (
                    <></>
                  )
                }
              />
              <Controller
                name={`${pathPrefix}.pipingKey` as Path<FormTemplateFormValues>}
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="piping-key">
                      Variable name (for piping)
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="piping-key"
                        {...field}
                        value={String(field.value ?? "")}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value.replace(/[^a-zA-Z0-9_]/g, "")
                          )
                        }
                        placeholder="e.g. name"
                        className="font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setValue(
                            `${pathPrefix}.pipingKey` as Path<FormTemplateFormValues>,
                            labelToPipingKey(
                              String(
                                getValues(
                                  `${pathPrefix}.label` as Path<FormTemplateFormValues>
                                ) ?? ""
                              )
                            )
                          )
                        }
                      >
                        Suggest from label
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{"}
                      {String(
                        watch(
                          `${pathPrefix}.pipingKey` as Path<FormTemplateFormValues>
                        ) ?? "name"
                      )}
                      {"}}"} in later questions to insert this answer.
                    </p>
                  </div>
                )}
              />
              <Controller
                name={`${pathPrefix}.required` as Path<FormTemplateFormValues>}
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="required">Required field</Label>
                  </div>
                )}
              />
              <Controller
                name={`${pathPrefix}.fieldType` as Path<FormTemplateFormValues>}
                control={control}
                render={({ field: { value: fieldType } }) => {
                  const needsOptions = fieldTypeHasOptions(
                    (fieldType ?? "text") as FormField["type"]
                  );
                  if (!needsOptions) return <></>;
                  return (
                    <OptionsFieldArray
                      pathPrefix={pathPrefix}
                      newOption={newOption}
                      setNewOption={setNewOption}
                    />
                  );
                }}
              />
            </>
          )}

          {isQuestion && (
            <QuestionConditionalLogicSection
              pathPrefix={pathPrefix}
              node={node}
              allFields={allFields}
            />
          )}

          <MediaSection
            pathPrefix={pathPrefix}
            formSlug={formSlug}
            uploadingMedia={uploadingMedia}
            onMediaUpload={handleMediaUpload}
          />

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            {onDelete && node.type !== "start" && node.type !== "end" && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(node.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ImageOption = { value: string; imageUrl: string; altText?: string };

function OptionsFieldArray({
  pathPrefix,
  newOption,
  setNewOption,
}: {
  pathPrefix: string;
  newOption: string;
  setNewOption: (v: string) => void;
}) {
  const { watch, setValue } = useFormContext<FormTemplateFormValues>();
  const optionsPath = `${pathPrefix}.field.options`;
  const optionDisplayPath = `${pathPrefix}.field.optionDisplay`;
  const options =
    (watch(optionsPath as Path<FormTemplateFormValues>) as
      | FormFieldOption[]
      | undefined) ?? [];
  const optionDisplay =
    (watch(optionDisplayPath as Path<FormTemplateFormValues>) as
      | "text"
      | "image"
      | undefined) ?? "text";

  const isImageMode = optionDisplay === "image";
  const textOptions = isImageMode
    ? (options as ImageOption[]).map((o) => o.value)
    : (options as string[]);
  const imageOptions = isImageMode
    ? (options as ImageOption[])
    : (options as string[]).map((s) => ({
        value: s || "",
        imageUrl: "",
        altText: s || "",
      }));

  const setDisplayMode = (mode: "text" | "image") => {
    setValue(optionDisplayPath as Path<FormTemplateFormValues>, mode, {
      shouldDirty: true,
    });
    if (mode === "image") {
      const converted = (options as FormFieldOption[]).map((o) =>
        typeof o === "string"
          ? { value: o || "Option", imageUrl: "", altText: o || "" }
          : o
      );
      setValue(optionsPath as Path<FormTemplateFormValues>, converted, {
        shouldDirty: true,
      });
    } else {
      const converted = (options as FormFieldOption[]).map(getOptionValue);
      setValue(optionsPath as Path<FormTemplateFormValues>, converted, {
        shouldDirty: true,
      });
    }
  };

  const remove = (index: number) => {
    const next = isImageMode
      ? (options as ImageOption[]).filter((_, i) => i !== index)
      : (options as string[]).filter((_, i) => i !== index);
    setValue(optionsPath as Path<FormTemplateFormValues>, next, {
      shouldDirty: true,
    });
  };

  const addTextOption = () => {
    if (!newOption.trim()) return;
    const opts = options as string[];
    if (opts.includes(newOption.trim())) return;
    setValue(
      optionsPath as Path<FormTemplateFormValues>,
      [...opts, newOption.trim()],
      {
        shouldDirty: true,
      }
    );
    setNewOption("");
  };

  const addImageOption = () => {
    const opts = options as ImageOption[];
    setValue(
      optionsPath as Path<FormTemplateFormValues>,
      [...opts, { value: "", imageUrl: "", altText: "" }],
      {
        shouldDirty: true,
      }
    );
  };

  const updateImageOption = (index: number, patch: Partial<ImageOption>) => {
    const opts = [...(options as ImageOption[])];
    opts[index] = { ...opts[index], ...patch };
    setValue(optionsPath as Path<FormTemplateFormValues>, opts, {
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Options display</Label>
        <Select
          value={optionDisplay}
          onValueChange={(v) => setDisplayMode(v as "text" | "image")}
        >
          <SelectTrigger className="mt-1 w-full max-w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="image">Images</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Options</Label>
        <div className="space-y-2 mt-2">
          {!isImageMode &&
            textOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input value={opt} readOnly className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          {isImageMode &&
            imageOptions.map((opt, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 p-3 border rounded-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Option {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Value"
                    value={opt.value}
                    onChange={(e) =>
                      updateImageOption(idx, { value: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Image URL"
                    value={opt.imageUrl}
                    onChange={(e) =>
                      updateImageOption(idx, { imageUrl: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Alt text (optional)"
                    value={opt.altText ?? ""}
                    onChange={(e) =>
                      updateImageOption(idx, { altText: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          {!isImageMode && (
            <div className="flex items-center gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTextOption();
                  }
                }}
                placeholder="Add option..."
                className="flex-1"
              />
              <Button type="button" onClick={addTextOption}>
                Add
              </Button>
            </div>
          )}
          {isImageMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImageOption}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add option
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionConditionalLogicSection({
  pathPrefix,
  node,
  allFields,
}: {
  pathPrefix: string;
  node: FlowchartNode;
  allFields: FormField[];
}) {
  const { control } = useFormContext<FormTemplateFormValues>();
  const currentId = node.data?.fieldId ?? node.id;
  const logicFields = allFields.filter((f) => f.id !== currentId);
  const jumpTargetFields = allFields.filter((f) => f.id !== currentId);
  const idx = allFields.findIndex((f) => f.id === currentId);
  const previousFields = idx <= 0 ? [] : allFields.slice(0, idx);

  return (
    <div className="pt-4 border-t space-y-4">
      <div className="space-y-2">
        <Controller
          name={
            `${pathPrefix}.field.enablePiping` as Path<FormTemplateFormValues>
          }
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-piping"
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor="enable-piping">Enable piping</Label>
            </div>
          )}
        />
        <Controller
          name={
            `${pathPrefix}.field.enablePiping` as Path<FormTemplateFormValues>
          }
          control={control}
          render={({ field: { value: enablePiping } }) =>
            enablePiping ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
                <p className="font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  How to use piping
                </p>
                <p>
                  In the <strong>Question</strong> or{" "}
                  <strong>Placeholder</strong> above, use the variable name in
                  double braces to insert an earlier answer, e.g. {"{{name}}"}.
                  Only questions that appear <strong>before</strong> this one
                  can be used.
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1">{"{{name}}"}</code>{" "}
                    — replaced by that question&apos;s answer
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1">
                      {"{{name:fallback}}"}
                    </code>{" "}
                    — if empty, shows &quot;fallback&quot; instead
                  </li>
                </ul>
                {previousFields.length === 0 ? (
                  <p className="text-muted-foreground text-xs pt-1">
                    No earlier questions in this form yet. Add questions above
                    this one and set their variable names to pipe answers.
                  </p>
                ) : (
                  <div className="pt-1">
                    <p className="text-muted-foreground text-xs font-medium mb-1">
                      Available variables (earlier questions):
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 font-mono">
                      {previousFields.map((f) => (
                        <li key={f.id}>
                          <code className="rounded bg-muted px-1">
                            {"{{"}
                            {getPipingDisplayToken(f)}
                            {"}}"}
                          </code>
                          {f.label
                            ? ` — ${f.label.slice(0, 30)}${f.label.length > 30 ? "…" : ""}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <></>
            )
          }
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Conditional Logic</Label>
        <p className="text-xs text-muted-foreground">
          Control visibility, jumps, and label text based on previous answers.
        </p>
        <Controller
          name={
            `${pathPrefix}.field.conditionalLogic.showIf` as Path<FormTemplateFormValues>
          }
          control={control}
          render={({ field }) => (
            <Collapsible
              defaultOpen={hasAnyConditions(
                field.value as ConditionGroup | ConditionBlock | undefined
              )}
              className="rounded-md border"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
                Show this field if
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-4 pb-4 pt-2">
                  <LogicBuilder
                    fields={logicFields}
                    value={
                      field.value as ConditionGroup | ConditionBlock | undefined
                    }
                    onChange={field.onChange}
                    label=""
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        />
        <Controller
          name={
            `${pathPrefix}.field.conditionalLogic.hideIf` as Path<FormTemplateFormValues>
          }
          control={control}
          render={({ field }) => (
            <Collapsible
              defaultOpen={hasAnyConditions(
                field.value as ConditionGroup | ConditionBlock | undefined
              )}
              className="rounded-md border"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
                Hide this field if
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-4 pb-4 pt-2">
                  <LogicBuilder
                    fields={logicFields}
                    value={
                      field.value as ConditionGroup | ConditionBlock | undefined
                    }
                    onChange={field.onChange}
                    label=""
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        />
        <JumpToFieldArray
          pathPrefix={pathPrefix}
          logicFields={logicFields}
          jumpTargetFields={jumpTargetFields}
        />
        <DynamicLabelFieldArray
          pathPrefix={pathPrefix}
          logicFields={logicFields}
        />
      </div>
    </div>
  );
}

function JumpToFieldArray({
  pathPrefix,
  logicFields,
  jumpTargetFields,
}: {
  pathPrefix: string;
  logicFields: FormField[];
  jumpTargetFields: FormField[];
}) {
  const { control } = useFormContext<FormTemplateFormValues>();
  const jumpToPath =
    `${pathPrefix}.field.conditionalLogic.jumpTo` as Path<FormTemplateFormValues>;
  const { fields, append, remove } = useFieldArray({
    control,
    name: jumpToPath as import("react-hook-form").FieldArrayPath<FormTemplateFormValues>,
  });
  const fallback = { operator: "AND" as const, conditions: [] };

  return (
    <Collapsible defaultOpen={fields.length > 0} className="rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
        Jump to another card when…
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 pb-4 pt-2 space-y-4">
          <p className="text-xs text-muted-foreground">
            After this card, jump to the first matching rule. Order matters.
          </p>
          {fields.map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg border bg-muted/20 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Rule {idx + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Controller
                name={
                  `${pathPrefix}.field.conditionalLogic.jumpTo.${idx}.conditions` as Path<FormTemplateFormValues>
                }
                control={control}
                render={({ field }) => (
                  <LogicBuilder
                    fields={logicFields}
                    value={
                      field.value as ConditionGroup | ConditionBlock | undefined
                    }
                    onChange={(v) => field.onChange(v ?? fallback)}
                    label="When"
                  />
                )}
              />
              <Controller
                name={
                  `${pathPrefix}.field.conditionalLogic.jumpTo.${idx}.targetFieldId` as Path<FormTemplateFormValues>
                }
                control={control}
                render={({ field }) => (
                  <div>
                    <Label className="text-xs">Jump to card</Label>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="mt-1 min-w-0 max-w-[220px]">
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        {jumpTargetFields.map((f) => (
                          <SelectItem
                            key={f.id}
                            value={f.id}
                            title={f.label || "(No label)"}
                          >
                            <div className="flex flex-col items-start gap-0.5 min-w-0 max-w-[260px] overflow-hidden">
                              <span className="truncate block text-left">
                                {f.label || "(No label)"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono truncate block text-left">
                                {"{{"}
                                {getPipingDisplayToken(f)}
                                {"}}"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                conditions: fallback,
                targetFieldId: jumpTargetFields[0]?.id ?? "",
              })
            }
            disabled={jumpTargetFields.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add jump rule
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DynamicLabelFieldArray({
  pathPrefix,
  logicFields,
}: {
  pathPrefix: string;
  logicFields: FormField[];
}) {
  const { control } = useFormContext<FormTemplateFormValues>();
  const dynamicLabelPath =
    `${pathPrefix}.field.conditionalLogic.dynamicLabel` as import("react-hook-form").FieldArrayPath<FormTemplateFormValues>;
  const { fields, append, remove } = useFieldArray({
    control,
    name: dynamicLabelPath,
  });
  const fallback = { operator: "AND" as const, conditions: [] };

  return (
    <Collapsible defaultOpen={fields.length > 0} className="rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
        Dynamic label (change question text when…)
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 pb-4 pt-2 space-y-4">
          <p className="text-xs text-muted-foreground">
            First matching rule sets the question text. You can use{" "}
            {"{{variable}}"} for piping.
          </p>
          {fields.map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg border bg-muted/20 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Rule {idx + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Controller
                name={
                  `${pathPrefix}.field.conditionalLogic.dynamicLabel.${idx}.conditions` as Path<FormTemplateFormValues>
                }
                control={control}
                render={({ field }) => (
                  <LogicBuilder
                    fields={logicFields}
                    value={
                      field.value as ConditionGroup | ConditionBlock | undefined
                    }
                    onChange={(v) => field.onChange(v ?? fallback)}
                    label="When"
                  />
                )}
              />
              <Controller
                name={
                  `${pathPrefix}.field.conditionalLogic.dynamicLabel.${idx}.label` as Path<FormTemplateFormValues>
                }
                control={control}
                render={({ field }) => (
                  <div>
                    <Label className="text-xs">Show label</Label>
                    <Textarea
                      {...field}
                      value={String(field.value ?? "")}
                      placeholder="Question text (use {{variable}} for piping)"
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                )}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ conditions: fallback, label: "" })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add dynamic label rule
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MediaSection({
  pathPrefix,
  formSlug,
  uploadingMedia,
  onMediaUpload,
}: {
  pathPrefix: string;
  formSlug?: string;
  uploadingMedia: boolean;
  onMediaUpload: (file: File) => void;
}) {
  const { watch, setValue, getValues, control } =
    useFormContext<FormTemplateFormValues>();
  const mediaPath = `${pathPrefix}.media`;
  const media = watch(mediaPath as Path<FormTemplateFormValues>) as
    | typeof defaultMediaFormValues
    | undefined;
  const mediaUrl = media?.url ?? "";
  const mediaType = media?.type ?? "image";
  const mediaPosition = media?.position ?? "above";
  const mediaAltText = media?.altText ?? "";
  const videoType = media?.videoType ?? "youtube";
  const videoId = media?.videoId ?? "";

  const clearMedia = () => {
    setValue(mediaPath as Path<FormTemplateFormValues>, null, {
      shouldDirty: true,
    });
  };

  const setMediaUrl = (url: string) => {
    const m = getValues(mediaPath as Path<FormTemplateFormValues>) as
      | typeof defaultMediaFormValues
      | undefined;
    setValue(
      mediaPath as Path<FormTemplateFormValues>,
      m ? { ...m, url } : { ...defaultMediaFormValues, url },
      { shouldDirty: true }
    );
  };

  return (
    <div className="pt-4 border-t space-y-4">
      <div className="flex items-center justify-between">
        <Label>Card Media</Label>
        {media && mediaUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={clearMedia}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Controller
        name={`${pathPrefix}.media.position` as Path<FormTemplateFormValues>}
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="media-position">Position</Label>
            <Select
              value={media ? String(field.value ?? "above") : "above"}
              onValueChange={(v) => {
                const m = getValues(
                  mediaPath as Path<FormTemplateFormValues>
                ) as typeof defaultMediaFormValues | undefined;
                if (m)
                  setValue(
                    mediaPath as Path<FormTemplateFormValues>,
                    { ...m, position: v as typeof m.position },
                    { shouldDirty: true }
                  );
                else
                  setValue(
                    mediaPath as Path<FormTemplateFormValues>,
                    { ...defaultMediaFormValues, position: v as "above" },
                    { shouldDirty: true }
                  );
              }}
            >
              <SelectTrigger id="media-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above Question</SelectItem>
                <SelectItem value="below">Below Question</SelectItem>
                <SelectItem value="background">Background</SelectItem>
                <SelectItem value="left">Left Side</SelectItem>
                <SelectItem value="right">Right Side</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      />
      {!mediaUrl ? (
        <>
          <Controller
            name={`${pathPrefix}.media.type` as Path<FormTemplateFormValues>}
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="media-type">Media Type</Label>
                <Select
                  value={media ? String(field.value ?? "image") : "image"}
                  onValueChange={(v) => {
                    const m = getValues(
                      mediaPath as Path<FormTemplateFormValues>
                    ) as typeof defaultMediaFormValues | undefined;
                    if (m)
                      setValue(
                        mediaPath as Path<FormTemplateFormValues>,
                        { ...m, type: v as typeof m.type },
                        { shouldDirty: true }
                      );
                    else
                      setValue(
                        mediaPath as Path<FormTemplateFormValues>,
                        { ...defaultMediaFormValues, type: v as "image" },
                        { shouldDirty: true }
                      );
                  }}
                >
                  <SelectTrigger id="media-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="icon">Icon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          {(mediaType === "image" || mediaType === "gif") && (
            <div>
              <Label htmlFor="media-upload">
                Upload {mediaType === "gif" ? "GIF" : "Image"}
              </Label>
              {!formSlug && (
                <p className="text-sm text-muted-foreground mt-1 mb-2">
                  Please save the form first to enable file uploads. You can
                  also enter a URL below instead.
                </p>
              )}
              <div className="mt-2">
                <Input
                  id="media-upload"
                  type="file"
                  accept={mediaType === "gif" ? "image/gif" : "image/*"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onMediaUpload(file);
                  }}
                  disabled={uploadingMedia || !formSlug}
                />
                {uploadingMedia && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
                {!formSlug && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    File upload disabled: Form must be saved first
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Label htmlFor="media-url">Or enter URL</Label>
                <Input
                  id="media-url"
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          )}
          {mediaType === "video" && (
            <>
              <Controller
                name={
                  `${pathPrefix}.media.videoType` as Path<FormTemplateFormValues>
                }
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="video-type">Video Source</Label>
                    <Select
                      value={
                        media ? String(field.value ?? "youtube") : "youtube"
                      }
                      onValueChange={(v) => {
                        const m = getValues(
                          mediaPath as Path<FormTemplateFormValues>
                        ) as typeof defaultMediaFormValues | undefined;
                        if (m)
                          setValue(
                            mediaPath as Path<FormTemplateFormValues>,
                            { ...m, videoType: v as typeof m.videoType },
                            { shouldDirty: true }
                          );
                      }}
                    >
                      <SelectTrigger id="video-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="vimeo">Vimeo</SelectItem>
                        <SelectItem value="upload">Upload Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {videoType === "upload" ? (
                <div>
                  <Label htmlFor="video-upload">Upload Video</Label>
                  {!formSlug && (
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      Please save the form first to enable file uploads.
                    </p>
                  )}
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onMediaUpload(file);
                    }}
                    disabled={uploadingMedia || !formSlug}
                  />
                  {!formSlug && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      File upload disabled: Form must be saved first
                    </p>
                  )}
                </div>
              ) : (
                <Controller
                  name={
                    `${pathPrefix}.media.videoId` as Path<FormTemplateFormValues>
                  }
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label htmlFor="video-id">
                        {videoType === "youtube"
                          ? "YouTube Video ID"
                          : "Vimeo Video ID"}
                      </Label>
                      <Input
                        id="video-id"
                        value={media ? String(field.value ?? "") : ""}
                        onChange={(e) => {
                          const m = getValues(
                            mediaPath as Path<FormTemplateFormValues>
                          ) as typeof defaultMediaFormValues | undefined;
                          if (m)
                            setValue(
                              mediaPath as Path<FormTemplateFormValues>,
                              { ...m, videoId: e.target.value },
                              { shouldDirty: true }
                            );
                        }}
                        placeholder={
                          videoType === "youtube" ? "dQw4w9WgXcQ" : "123456789"
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {videoType === "youtube"
                          ? "Enter the video ID from the YouTube URL (e.g., dQw4w9WgXcQ from youtube.com/watch?v=dQw4w9WgXcQ)"
                          : "Enter the video ID from the Vimeo URL"}
                      </p>
                    </div>
                  )}
                />
              )}
            </>
          )}
          {mediaType === "icon" && (
            <div>
              <Label htmlFor="icon-url">Icon URL</Label>
              <Input
                id="icon-url"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/icon.svg"
              />
            </div>
          )}
          {mediaUrl && (mediaType === "image" || mediaType === "gif") && (
            <Controller
              name={
                `${pathPrefix}.media.altText` as Path<FormTemplateFormValues>
              }
              control={control}
              render={({ field }) => (
                <div>
                  <Label htmlFor="media-alt">Alt Text</Label>
                  <Input
                    id="media-alt"
                    value={media ? String(field.value ?? "") : ""}
                    onChange={(e) => {
                      const m = getValues(
                        mediaPath as Path<FormTemplateFormValues>
                      ) as typeof defaultMediaFormValues | undefined;
                      if (m)
                        setValue(
                          mediaPath as Path<FormTemplateFormValues>,
                          { ...m, altText: e.target.value },
                          { shouldDirty: true }
                        );
                    }}
                    placeholder="Describe the image for accessibility"
                  />
                </div>
              )}
            />
          )}
        </>
      ) : (
        <div className="space-y-2">
          {(mediaType === "image" || mediaType === "gif") && (
            <div className="w-full h-48 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <img
                src={mediaUrl}
                alt={mediaAltText || "Card media"}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          {mediaType === "video" && videoType === "youtube" && videoId && (
            <div className="aspect-video border rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          {mediaType === "video" && videoType === "vimeo" && videoId && (
            <div className="aspect-video border rounded-lg overflow-hidden">
              <iframe
                src={`https://player.vimeo.com/video/${videoId}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          {mediaType === "video" && videoType === "upload" && mediaUrl && (
            <div className="aspect-video border rounded-lg overflow-hidden">
              <video src={mediaUrl} controls className="w-full h-full" />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Position: {mediaPosition}
          </p>
        </div>
      )}
    </div>
  );
}
