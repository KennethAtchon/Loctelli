"use client";

import { useState, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import type { FormField, ConditionGroup, ConditionBlock } from "@/lib/forms/types";
import { getPipingDisplayToken } from "@/lib/forms/conditional-logic";
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
import {
  getDefaultFormValues,
  formValuesToUpdates,
} from "./card-settings-panel-form-utils";

function hasAnyConditions(
  logic: ConditionGroup | ConditionBlock | undefined
): boolean {
  if (!logic) return false;
  if ("groups" in logic) {
    return logic.groups.some((g) => g.conditions.length > 0);
  }
  return logic.conditions.length > 0;
}

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Select Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
  { value: "file", label: "File Upload" },
  { value: "image", label: "Image Upload" },
];

const dummyNode = {
  id: "",
  type: "question" as const,
  data: {},
  position: { x: 0, y: 0 },
} as FlowchartNode;

export interface CardSettingsPanelProps {
  node: FlowchartNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (nodeId: string, updates: Partial<FlowchartNodeData>) => void;
  onDelete?: (nodeId: string) => void;
  formSlug?: string;
  allFields?: FormField[];
}

export function CardSettingsPanel({
  node,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  formSlug,
  allFields = [],
}: CardSettingsPanelProps) {
  const form = useForm<NodeSettingsFormValues>({
    defaultValues: getDefaultFormValues(node ?? dummyNode),
    values: node ? getDefaultFormValues(node) : undefined,
  });

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
      formData.append("fieldId", `media_${node?.id ?? Date.now()}`);
      const result = await api.forms.uploadAdminFile(formSlug, formData);
      const current = form.getValues("media");
      form.setValue("media", current ? { ...current, url: result.url } : { ...defaultMediaFormValues, url: result.url });
      toast({ title: "Success", description: "Media uploaded successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const onSubmit = (values: NodeSettingsFormValues) => {
    if (!node) return;
    onUpdate(node.id, formValuesToUpdates(values, node));
  };

  if (!node) return null;

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
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 mt-6 p-6 pt-4"
        >
          {isStatement ? (
            <>
              <Controller
                name="statementText"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="statement-text">Statement Text</Label>
                    <Textarea
                      id="statement-text"
                      {...field}
                      placeholder="Enter the statement text..."
                      rows={4}
                    />
                  </div>
                )}
              />
              <Controller
                name="isSuccessCard"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-success-card"
                      checked={field.value}
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
                name="fieldType"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="field-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
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
                name="label"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="label">Question Label *</Label>
                    <Input id="label" {...field} placeholder="What is your name?" />
                  </div>
                )}
              />
              <Controller
                name="fieldType"
                control={form.control}
                render={({ field: { value: fieldType } }) =>
                  fieldType !== "checkbox" ? (
                    <Controller
                      name="placeholder"
                      control={form.control}
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="placeholder">Placeholder</Label>
                          <Input
                            id="placeholder"
                            {...field}
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
                name="pipingKey"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="piping-key">Variable name (for piping)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="piping-key"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                        }
                        placeholder="e.g. name"
                        className="font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          form.setValue("pipingKey", labelToPipingKey(form.getValues("label")))
                        }
                      >
                        Suggest from label
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{"}
                      {form.watch("pipingKey") || "name"}
                      {"}}"} in later questions to insert this answer.
                    </p>
                  </div>
                )}
              />
              <Controller
                name="required"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="required">Required field</Label>
                  </div>
                )}
              />
              <Controller
                name="fieldType"
                control={form.control}
                render={({ field: { value: fieldType } }) => {
                  const needsOptions = ["select", "radio", "checkbox"].includes(fieldType);
                  if (!needsOptions) return <></>;
                  return (
                    <OptionsFieldArray
                      form={form}
                      newOption={newOption}
                      setNewOption={setNewOption}
                      onAddOption={(opt) => {
                        const opts = form.getValues("options");
                        if (opt.trim() && !opts.includes(opt.trim())) {
                          form.setValue("options", [...opts, opt.trim()]);
                          setNewOption("");
                        }
                      }}
                    />
                  );
                }}
              />
            </>
          )}

          {isQuestion && (
            <QuestionConditionalLogicSection form={form} node={node} allFields={allFields} />
          )}

          <MediaSection
            form={form}
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

function OptionsFieldArray({
  form,
  newOption,
  setNewOption,
  onAddOption,
}: {
  form: import("react-hook-form").UseFormReturn<NodeSettingsFormValues>;
  newOption: string;
  setNewOption: (v: string) => void;
  onAddOption: (opt: string) => void;
}) {
  const options = form.watch("options") ?? [];
  const remove = (index: number) => {
    form.setValue(
      "options",
      options.filter((_, i) => i !== index)
    );
  };
  return (
    <div>
      <Label>Options</Label>
      <div className="space-y-2 mt-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input value={opt} readOnly />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddOption(newOption);
              }
            }}
            placeholder="Add option..."
          />
          <Button type="button" onClick={() => onAddOption(newOption)}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionConditionalLogicSection({
  form,
  node,
  allFields,
}: {
  form: import("react-hook-form").UseFormReturn<NodeSettingsFormValues>;
  node: FlowchartNode;
  allFields: FormField[];
}) {
  const currentId = node.data?.fieldId ?? node.id;
  const logicFields = allFields.filter((f) => f.id !== currentId);
  const jumpTargetFields = allFields.filter((f) => f.id !== currentId);
  const idx = allFields.findIndex((f) => f.id === currentId);
  const previousFields = idx <= 0 ? [] : allFields.slice(0, idx);

  return (
    <div className="pt-4 border-t space-y-4">
      <div className="space-y-2">
        <Controller
          name="enablePiping"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Switch id="enable-piping" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="enable-piping">Enable piping</Label>
            </div>
          )}
        />
        <Controller
          name="enablePiping"
          control={form.control}
          render={({ field: { value: enablePiping } }) =>
            enablePiping ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
                <p className="font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  How to use piping
                </p>
                <p>
                  In the <strong>Question</strong> or <strong>Placeholder</strong> above, use the
                  variable name in double braces to insert an earlier answer, e.g. {"{{name}}"}.
                  Only questions that appear <strong>before</strong> this one can be used.
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1">{"{{name}}"}</code> — replaced by that
                    question&apos;s answer
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1">{"{{name:fallback}}"}</code> — if empty,
                    shows &quot;fallback&quot; instead
                  </li>
                </ul>
                {previousFields.length === 0 ? (
                  <p className="text-muted-foreground text-xs pt-1">
                    No earlier questions in this form yet. Add questions above this one and set
                    their variable names to pipe answers.
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
          name="conditionalLogic.showIf"
          control={form.control}
          render={({ field }) => (
            <Collapsible
              defaultOpen={hasAnyConditions(field.value)}
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
                    value={field.value}
                    onChange={field.onChange}
                    label=""
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        />
        <Controller
          name="conditionalLogic.hideIf"
          control={form.control}
          render={({ field }) => (
            <Collapsible
              defaultOpen={hasAnyConditions(field.value)}
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
                    value={field.value}
                    onChange={field.onChange}
                    label=""
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        />
        <JumpToFieldArray form={form} logicFields={logicFields} jumpTargetFields={jumpTargetFields} />
        <DynamicLabelFieldArray form={form} logicFields={logicFields} />
      </div>
    </div>
  );
}

function JumpToFieldArray({
  form,
  logicFields,
  jumpTargetFields,
}: {
  form: import("react-hook-form").UseFormReturn<NodeSettingsFormValues>;
  logicFields: FormField[];
  jumpTargetFields: FormField[];
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "conditionalLogic.jumpTo",
  });
  const fallback = { operator: "AND" as const, conditions: [] };

  return (
    <Collapsible
      defaultOpen={fields.length > 0}
      className="rounded-md border"
    >
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
            <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Rule {idx + 1}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Controller
                name={`conditionalLogic.jumpTo.${idx}.conditions`}
                control={form.control}
                render={({ field }) => (
                  <LogicBuilder
                    fields={logicFields}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? fallback)}
                    label="When"
                  />
                )}
              />
              <Controller
                name={`conditionalLogic.jumpTo.${idx}.targetFieldId`}
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label className="text-xs">Jump to card</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1 min-w-0 max-w-[220px]">
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        {jumpTargetFields.map((f) => (
                          <SelectItem key={f.id} value={f.id} title={f.label || "(No label)"}>
                            <div className="flex flex-col items-start gap-0.5 min-w-0 max-w-[260px] overflow-hidden">
                              <span className="truncate block text-left">{f.label || "(No label)"}</span>
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
  form,
  logicFields,
}: {
  form: import("react-hook-form").UseFormReturn<NodeSettingsFormValues>;
  logicFields: FormField[];
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "conditionalLogic.dynamicLabel",
  });
  const fallback = { operator: "AND" as const, conditions: [] };

  return (
    <Collapsible
      defaultOpen={fields.length > 0}
      className="rounded-md border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
        Dynamic label (change question text when…)
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 pb-4 pt-2 space-y-4">
          <p className="text-xs text-muted-foreground">
            First matching rule sets the question text. You can use {"{{variable}}"} for piping.
          </p>
          {fields.map((_, idx) => (
            <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Rule {idx + 1}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Controller
                name={`conditionalLogic.dynamicLabel.${idx}.conditions`}
                control={form.control}
                render={({ field }) => (
                  <LogicBuilder
                    fields={logicFields}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? fallback)}
                    label="When"
                  />
                )}
              />
              <Controller
                name={`conditionalLogic.dynamicLabel.${idx}.label`}
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label className="text-xs">Show label</Label>
                    <Textarea
                      {...field}
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
  form,
  formSlug,
  uploadingMedia,
  onMediaUpload,
}: {
  form: import("react-hook-form").UseFormReturn<NodeSettingsFormValues>;
  formSlug?: string;
  uploadingMedia: boolean;
  onMediaUpload: (file: File) => void;
}) {
  const media = form.watch("media");
  const mediaUrl = media?.url ?? "";
  const mediaType = media?.type ?? "image";
  const mediaPosition = media?.position ?? "above";
  const mediaAltText = media?.altText ?? "";
  const videoType = media?.videoType ?? "youtube";
  const videoId = media?.videoId ?? "";

  const clearMedia = () => {
    form.setValue("media", null);
  };

  const setMediaUrl = (url: string) => {
    const m = form.getValues("media");
    form.setValue("media", m ? { ...m, url } : { ...defaultMediaFormValues, url });
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
        name="media.position"
        control={form.control}
        render={({ field }) => (
          <div>
            <Label htmlFor="media-position">Position</Label>
            <Select
              value={media ? field.value : "above"}
              onValueChange={(v) => {
                const m = form.getValues("media");
                if (m) form.setValue("media", { ...m, position: v as typeof m.position });
                else form.setValue("media", { ...defaultMediaFormValues, position: v as "above" });
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
            name="media.type"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label htmlFor="media-type">Media Type</Label>
                <Select
                  value={media ? field.value : "image"}
                  onValueChange={(v) => {
                    const m = form.getValues("media");
                    if (m) form.setValue("media", { ...m, type: v as typeof m.type });
                    else form.setValue("media", { ...defaultMediaFormValues, type: v as "image" });
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
              <Label htmlFor="media-upload">Upload {mediaType === "gif" ? "GIF" : "Image"}</Label>
              {!formSlug && (
                <p className="text-sm text-muted-foreground mt-1 mb-2">
                  Please save the form first to enable file uploads. You can also enter a URL below
                  instead.
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
                name="media.videoType"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="video-type">Video Source</Label>
                    <Select
                      value={media ? field.value : "youtube"}
                      onValueChange={(v) => {
                        const m = form.getValues("media");
                        if (m) form.setValue("media", { ...m, videoType: v as typeof m.videoType });
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
                  name="media.videoId"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label htmlFor="video-id">
                        {videoType === "youtube" ? "YouTube Video ID" : "Vimeo Video ID"}
                      </Label>
                      <Input
                        id="video-id"
                        value={media ? field.value : ""}
                        onChange={(e) => {
                          const m = form.getValues("media");
                          if (m) form.setValue("media", { ...m, videoId: e.target.value });
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
              name="media.altText"
              control={form.control}
              render={({ field }) => (
                <div>
                  <Label htmlFor="media-alt">Alt Text</Label>
                  <Input
                    id="media-alt"
                    value={media ? field.value : ""}
                    onChange={(e) => {
                      const m = form.getValues("media");
                      if (m) form.setValue("media", { ...m, altText: e.target.value });
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
          <p className="text-sm text-muted-foreground">Position: {mediaPosition}</p>
        </div>
      )}
    </div>
  );
}
