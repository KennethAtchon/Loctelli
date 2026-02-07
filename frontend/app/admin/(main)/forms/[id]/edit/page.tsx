"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { FormTemplate, UpdateFormTemplateDto } from "@/lib/forms/types";
import { FormFieldsSection } from "@/components/admin/forms/form-sections/form-fields-section";
import { FormBasicInfoCard } from "@/components/admin/forms/form-sections/form-basic-info-card";
import { FormDisplaySettingsCard } from "@/components/admin/forms/form-sections/form-display-settings-card";
import { FormAdvancedSettingsCard } from "@/components/admin/forms/form-sections/form-advanced-settings-card";
import { FormCardBuilderSection } from "@/components/admin/forms/form-sections/form-card-builder-section";
import { FormProfileEstimationSection } from "@/components/admin/forms/form-sections/form-profile-estimation-section";
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
} from "@/lib/forms/flowchart-serialization";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";
import {
  getDefaultFormValues,
  formValuesToProfileEstimation,
} from "@/components/admin/forms/profile-estimation/profile-estimation-form-utils";

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
    requiresWakeUp: t.requiresWakeUp,
    wakeUpInterval: t.wakeUpInterval ?? 30,
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
  const { toast } = useToast();

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
      form.reset(templateToFormValues(templateData));
    } catch (error: unknown) {
      console.error("Failed to load template:", error);
      toast({
        title: "Error",
        description: "Failed to load form template",
        variant: "destructive",
      });
      router.push("/admin/forms");
    } finally {
      setInitialLoading(false);
    }
  };

  const setValue = form.setValue;
  const watch = form.watch;

  const handleNameChange = (name: string) => {
    setValue("name", name);
    if (template && watch("slug") === generateSlug(template.name)) {
      setValue("slug", generateSlug(name));
    }
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
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const currentSchema = values.schema || [];
    const invalidFields = currentSchema.filter((field) => !field.label?.trim());
    if (!isCardForm && invalidFields.length > 0) {
      toast({
        title: "Validation Error",
        description: "All form fields must have labels",
        variant: "destructive",
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

      toast({
        title: "Success",
        description: "Form template updated successfully",
      });

      router.push("/admin/forms");
    } catch (error: unknown) {
      console.error("Failed to update form template:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update form template",
        variant: "destructive",
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
            onTitleChange={(title) => setValue("title", title)}
            onSubtitleChange={(subtitle) => setValue("subtitle", subtitle)}
            onSubmitButtonTextChange={(text) =>
              setValue("submitButtonText", text)
            }
            onSuccessMessageChange={(message) =>
              setValue("successMessage", message)
            }
          />

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

          <FormAdvancedSettingsCard
            requiresWakeUp={watch("requiresWakeUp") ?? false}
            wakeUpInterval={watch("wakeUpInterval") ?? 30}
            onRequiresWakeUpChange={(enabled) =>
              setValue("requiresWakeUp", enabled)
            }
            onWakeUpIntervalChange={(interval) =>
              setValue("wakeUpInterval", interval)
            }
          />

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
