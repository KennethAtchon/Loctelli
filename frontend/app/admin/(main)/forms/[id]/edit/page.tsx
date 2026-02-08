"use client";

import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { FormTemplate, UpdateFormTemplateDto } from "@/lib/forms/types";
import { FormFieldsSection } from "@/components/admin/forms/form-sections/form-fields-section";
import { FormBasicInfoCard } from "@/components/admin/forms/form-sections/form-basic-info-card";
import { FormDisplaySettingsCard } from "@/components/admin/forms/form-sections/form-display-settings-card";
import { FormCardBuilderSection } from "@/components/admin/forms/form-sections/form-card-builder-section";
import { FormProfileEstimationSection } from "@/components/admin/forms/form-sections/form-profile-estimation-section";
import { FormAppearanceSection } from "@/components/admin/forms/form-sections/form-appearance-section";
import { AnalyticsDashboard } from "@/components/admin/forms/analytics-dashboard";
import { Form } from "@/components/ui/form";
import {
  useFormTemplateFormStateRHF,
  type FormTemplateFormValues,
} from "../../hooks/use-form-template-form-state";
import { generateSlug, validateFormTemplate } from "@/lib/forms/form-utils";
import {
  flowchartToSchema,
  schemaToFlowchart,
  validateFlowchartGraph,
  buildFlowchartFromSchemaAndEdges,
} from "@/lib/forms/flowchart-serialization";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";
import {
  CARD_FORM_TEMPLATE_JSON_VERSION,
  type CardFormTemplateJson,
} from "@/lib/forms/card-form-template-json";
import {
  getDefaultFormValues,
  formValuesToProfileEstimation,
} from "@/components/admin/forms/profile-estimation/profile-estimation-form-utils";
import { getApiErrorMessage } from "@/lib/api/error-utils";

function templateToFormValues(t: FormTemplate): FormTemplateFormValues {
  return {
    name: t.name,
    slug: t.slug,
    description: t.description,
    formType: t.formType,
    schema: t.schema ?? [],
    title: t.title,
    subtitle: t.subtitle,
    submitButtonText: t.submitButtonText,
    successMessage: t.successMessage,
    isActive: t.isActive,
    cardSettings: t.cardSettings,
    profileEstimation: getDefaultFormValues(t.profileEstimation),
    styling: t.styling,
    analyticsEnabled: t.analyticsEnabled,
  };
}

export default function EditFormTemplatePage() {
  const params = useParams();
  const formId = params.id as string;
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  const form = useForm<FormTemplateFormValues>({
    defaultValues: {
      name: "",
      slug: "",
      schema: [],
      title: "",
      profileEstimation: getDefaultFormValues(undefined),
    },
  });

  const {
    defaultFlowchartGraph,
    cardFormSchema,
    addField,
    updateField,
    removeField,
    exportSchemaToJSON,
    handleImportFields,
  } = useFormTemplateFormStateRHF(form, {
    exportFileName: template?.slug ?? form.watch("slug"),
  });

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const loadTemplate = async () => {
    try {
      const templateData = await api.forms.getFormTemplate(formId);
      setTemplate(templateData);
      let values = templateToFormValues(templateData);
      if (
        templateData.formType === "CARD" &&
        values.cardSettings?.flowchartGraph
      ) {
        const errs = validateFlowchartGraph(
          values.cardSettings.flowchartGraph as FlowchartGraph
        );
        if (errs.length > 0) {
          toast.error("Invalid saved flowchart", {
            description:
              "The saved flowchart was invalid; recovered using form schema. Please review and save again.",
          });
          values = {
            ...values,
            cardSettings: {
              ...values.cardSettings,
              flowchartGraph: schemaToFlowchart(templateData.schema ?? []),
              flowchartViewport: undefined,
            },
          };
        }
      }
      form.reset(values);
    } catch (error: unknown) {
      console.error("Failed to load template:", error);
      toast.error("Could not load form", {
        description: getApiErrorMessage(
          error,
          "Failed to load form template. Please try again."
        ),
      });
      router.push("/admin/forms");
    } finally {
      setInitialLoading(false);
    }
  };

  const setValue = form.setValue;
  const watch = form.watch;

  const handleNameChange = (name: string) => {
    const previousName = watch("name");
    flushSync(() => {
      setValue("name", name);
    });
    const slug = watch("slug");
    const slugWasFromPreviousName =
      !previousName || slug === generateSlug(previousName);
    if (
      template &&
      (slug === generateSlug(template.name) || slugWasFromPreviousName)
    ) {
      setValue("slug", generateSlug(name));
    }
  };

  const handleTitleChange = (title: string) => {
    flushSync(() => {
      setValue("title", title);
    });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const isCardForm = values.formType === "CARD";
    const schemaForValidation =
      isCardForm && values.cardSettings?.flowchartGraph
        ? flowchartToSchema(
            values.cardSettings.flowchartGraph as FlowchartGraph
          )
        : values.schema || [];
    const validation = validateFormTemplate(
      values.name || "",
      values.slug || "",
      values.title || "",
      schemaForValidation,
      isCardForm
    );

    if (!validation.isValid) {
      toast.error("Validation Error", { description: validation.error });
      return;
    }

    const currentSchema = values.schema || [];
    const invalidFields = currentSchema.filter((field) => !field.label?.trim());
    if (!isCardForm && invalidFields.length > 0) {
      toast.error("Validation Error", {
        description: "All form fields must have labels",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: UpdateFormTemplateDto = isCardForm
        ? {
            ...values,
            schema: flowchartToSchema(
              (values.cardSettings?.flowchartGraph as FlowchartGraph) ??
                schemaToFlowchart([])
            ),
            profileEstimation: formValuesToProfileEstimation(
              values.profileEstimation ?? getDefaultFormValues(undefined)
            ),
          }
        : {
            ...values,
            profileEstimation: formValuesToProfileEstimation(
              values.profileEstimation ?? getDefaultFormValues(undefined)
            ),
          };
      await api.forms.updateFormTemplate(formId, payload);

      toast.success("Success", {
        description: "Form template updated successfully",
      });

      router.push("/admin/forms");
    } catch (error: unknown) {
      console.error("Failed to update form template:", error);
      toast.error("Could not save form", {
        description: getApiErrorMessage(
          error,
          "Failed to update form template. Please try again."
        ),
      });
    } finally {
      setLoading(false);
    }
  });

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading form template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Form template not found</p>
          <Button onClick={() => router.push("/admin/forms")} className="mt-4">
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  const isCardForm = template.formType === "CARD";

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Edit {isCardForm ? "Card Form" : "Simple Form"}
          </h1>
          <div className="ml-auto">
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label className="ml-2">Active</Label>
          </div>
        </div>

        {isCardForm && (
          <FormCardBuilderSection
            graph={
              (watch("cardSettings")?.flowchartGraph as FlowchartGraph) ??
              defaultFlowchartGraph
            }
            onGraphChange={(newGraph) =>
              setValue("cardSettings", {
                ...(watch("cardSettings") as
                  | Record<string, unknown>
                  | undefined),
                flowchartGraph: newGraph,
                flowchartViewport: newGraph.viewport,
              })
            }
            getFullCardFormPayload={() => {
              const values = form.getValues();
              const graph =
                (values.cardSettings?.flowchartGraph as FlowchartGraph) ??
                defaultFlowchartGraph;
              return {
                version: CARD_FORM_TEMPLATE_JSON_VERSION,
                title: values.title,
                subtitle: values.subtitle,
                submitButtonText: values.submitButtonText,
                successMessage: values.successMessage,
                flowchartGraph: graph,
                cardSettings: values.cardSettings,
                styling: values.styling ?? undefined,
                profileEstimation:
                  formValuesToProfileEstimation(
                    values.profileEstimation ?? getDefaultFormValues(undefined)
                  ) ?? undefined,
              };
            }}
            onImportFullCardForm={(payload: CardFormTemplateJson) => {
              const current = form.getValues();
              let graph: FlowchartGraph | undefined;
              if (payload.schema?.length && payload.flowchartEdges?.length) {
                graph = buildFlowchartFromSchemaAndEdges(
                  payload.schema,
                  payload.flowchartEdges
                );
              } else if (payload.schema?.length) {
                graph = schemaToFlowchart(payload.schema);
              } else if (payload.flowchartGraph) {
                const errs = validateFlowchartGraph(payload.flowchartGraph);
                if (errs.length > 0)
                  throw new Error(
                    "Invalid flowchartGraph: " +
                      errs.slice(0, 3).join("; ") +
                      (errs.length > 3 ? ` (+${errs.length - 3} more)` : "")
                  );
                graph = payload.flowchartGraph;
              }
              const merged: FormTemplateFormValues = {
                ...current,
                title: payload.title ?? current.title,
                subtitle: payload.subtitle ?? current.subtitle,
                submitButtonText:
                  payload.submitButtonText ?? current.submitButtonText,
                successMessage:
                  payload.successMessage ?? current.successMessage,
                styling: payload.styling ?? current.styling,
                profileEstimation: getDefaultFormValues(
                  payload.profileEstimation ?? undefined
                ),
              };
              if (graph) {
                merged.cardSettings = {
                  ...(current.cardSettings as
                    | Record<string, unknown>
                    | undefined),
                  ...payload.cardSettings,
                  flowchartGraph: graph,
                  flowchartViewport: graph.viewport,
                };
              }
              // reset() syncs useFieldArray (categories, ranges, etc.); setValue alone does not
              form.reset(merged);
            }}
            formSlug={watch("slug") || template?.slug}
          />
        )}

        {isCardForm && <FormProfileEstimationSection fields={cardFormSchema} />}

        {!!watch("analyticsEnabled") && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View form performance metrics and user behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsDashboard formTemplateId={formId} />
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormBasicInfoCard
            name={watch("name") || ""}
            slug={watch("slug") || ""}
            description={watch("description") || ""}
            onNameChange={handleNameChange}
            onSlugChange={(slug) => setValue("slug", slug)}
            onDescriptionChange={(description) =>
              setValue("description", description)
            }
          />

          <FormDisplaySettingsCard
            title={watch("title") || ""}
            subtitle={watch("subtitle") || ""}
            submitButtonText={watch("submitButtonText")}
            successMessage={watch("successMessage")}
            isCardForm={isCardForm}
            onTitleChange={handleTitleChange}
            onSubtitleChange={(subtitle) => setValue("subtitle", subtitle)}
            onSubmitButtonTextChange={(text) =>
              setValue("submitButtonText", text)
            }
            onSuccessMessageChange={(message) =>
              setValue("successMessage", message)
            }
          />

          {isCardForm && (
            <FormAppearanceSection formSlug={watch("slug") ?? template?.slug} />
          )}

          {!isCardForm && (
            <FormFieldsSection
              schema={watch("schema") || []}
              onAddField={addField}
              onUpdateField={updateField}
              onRemoveField={removeField}
              onImportFields={handleImportFields}
              onExportSchema={exportSchemaToJSON}
            />
          )}

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
}
