"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useTenant } from "@/contexts/tenant-context";
import { FormFieldsSection } from "@/components/admin/forms/form-sections/form-fields-section";
import { FormBasicInfoCard } from "@/components/admin/forms/form-sections/form-basic-info-card";
import { FormDisplaySettingsCard } from "@/components/admin/forms/form-sections/form-display-settings-card";
import { FormAdvancedSettingsCard } from "@/components/admin/forms/form-sections/form-advanced-settings-card";
import { FormCardBuilderSection } from "@/components/admin/forms/form-sections/form-card-builder-section";
import { FormProfileEstimationSection } from "@/components/admin/forms/form-sections/form-profile-estimation-section";
import { Form } from "@/components/ui/form";
import {
  useFormTemplateFormStateRHF,
  type FormTemplateFormValues,
} from "../hooks/use-form-template-form-state";
import { generateSlug, validateFormTemplate } from "@/lib/forms/form-utils";
import {
  flowchartToSchema,
  schemaToFlowchart,
} from "@/lib/forms/flowchart-serialization";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";
import type { CreateFormTemplateDto, FormType } from "@/lib/forms/types";
import {
  getDefaultFormValues,
  formValuesToProfileEstimation,
} from "@/components/admin/forms/profile-estimation/profile-estimation-form-utils";

const defaultValues: FormTemplateFormValues = {
  name: "",
  slug: "",
  description: "",
  formType: "SIMPLE",
  schema: [],
  title: "",
  subtitle: "",
  submitButtonText: "Submit",
  successMessage: "Thank you for your submission!",
  requiresWakeUp: true,
  wakeUpInterval: 30,
  profileEstimation: getDefaultFormValues(undefined),
};

export default function NewFormTemplatePage() {
  const { subAccountId } = useTenant();
  const [formType, setFormType] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormTemplateFormValues>({
    defaultValues,
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
    exportFileName: form.watch("slug"),
  });

  const setValue = form.setValue;
  const watch = form.watch;

  const handleNameChange = (name: string) => {
    setValue("name", name);
    const slug = watch("slug");
    if (!slug || slug === generateSlug(watch("name"))) {
      setValue("slug", generateSlug(name));
    }
    const title = watch("title");
    if (!title || title === watch("name")) {
      setValue("title", name);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const isCardForm = values.formType === "CARD";
    const schemaForValidation = isCardForm
      ? flowchartToSchema(
          (values.cardSettings?.flowchartGraph as FlowchartGraph) ??
            schemaToFlowchart([])
        )
      : values.schema;
    const validation = validateFormTemplate(
      values.name,
      values.slug,
      values.title,
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

    const invalidFields = values.schema.filter((field) => !field.label?.trim());
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
      const dataToSubmit: CreateFormTemplateDto = {
        ...values,
        subAccountId: subAccountId ?? undefined,
        profileEstimation: formValuesToProfileEstimation(
          values.profileEstimation ?? getDefaultFormValues(undefined)
        ),
        ...(isCardForm && {
          schema: flowchartToSchema(
            (values.cardSettings?.flowchartGraph as FlowchartGraph) ??
              schemaToFlowchart([])
          ),
          cardSettings: values.cardSettings,
        }),
      };

      await api.forms.createFormTemplate(dataToSubmit);

      toast({
        title: "Success",
        description: "Form template created successfully",
      });

      router.push("/admin/forms");
    } catch (error: unknown) {
      console.error("Failed to create form template:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create form template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  });

  if (formType === null) {
    return (
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
          <h1 className="text-2xl font-bold">Create New Form</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Choose the form type. Simple Form shows all fields on one page; Card
          Form shows one question per screen with an interactive flowchart
          builder.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <Card
            className="cursor-pointer border-2 hover:border-primary transition-colors"
            onClick={() => {
              setFormType("SIMPLE");
              setValue("formType", "SIMPLE");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div>
                  <CardTitle>Simple Form</CardTitle>
                  <CardDescription>
                    Traditional layout: all fields visible on one page. Best for
                    contact forms and quick surveys.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer border-2 hover:border-primary transition-colors"
            onClick={() => {
              setFormType("CARD");
              setValue("formType", "CARD");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                <div>
                  <CardTitle>Card Form</CardTitle>
                  <CardDescription>
                    One question per screen with progress and branching. Build
                    interactive forms using the visual flowchart editor.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const isCardForm = formType === "CARD";

  return (
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setFormType(null);
            setValue("formType", "SIMPLE");
          }}
        >
          Change type
        </Button>
        <h1 className="text-2xl font-bold">
          Create New {isCardForm ? "Card Form" : "Simple Form"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormBasicInfoCard
            name={watch("name")}
            slug={watch("slug")}
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
              formSlug={watch("slug")}
              description="Build your interactive card form using the flowchart editor. Preview will be available after you create the form."
            />
          )}

          {isCardForm && (
            <FormProfileEstimationSection fields={cardFormSchema} />
          )}

          {!isCardForm && (
            <FormFieldsSection
              schema={watch("schema")}
              onAddField={addField}
              onUpdateField={updateField}
              onRemoveField={removeField}
              onImportFields={handleImportFields}
              onExportSchema={exportSchemaToJSON}
            />
          )}

          <FormAdvancedSettingsCard
            requiresWakeUp={watch("requiresWakeUp") ?? false}
            wakeUpInterval={watch("wakeUpInterval") ?? 0}
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
              {loading ? "Creating..." : "Create Form Template"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
