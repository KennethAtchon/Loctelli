"use client";

import { useState } from "react";
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
import { generateSlug, validateFormTemplate } from "@/lib/forms/form-utils";
import type {
  CreateFormTemplateDto,
  FormField,
  FormType,
  ProfileEstimation,
} from "@/lib/api/endpoints/forms";

export default function NewFormTemplatePage() {
  const { subAccountId } = useTenant();
  const [formType, setFormType] = useState<FormType | null>(null);
  const [formData, setFormData] = useState<CreateFormTemplateDto>({
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
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (
    field: keyof CreateFormTemplateDto,
    value:
      | string
      | number
      | boolean
      | FormField[]
      | Record<string, unknown>
      | ProfileEstimation
      | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNameChange = (name: string) => {
    handleInputChange("name", name);
    if (!formData.slug || formData.slug === generateSlug(formData.name)) {
      handleInputChange("slug", generateSlug(name));
    }
    if (!formData.title || formData.title === formData.name) {
      handleInputChange("title", name);
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "",
      required: false,
    };
    handleInputChange("schema", [...formData.schema, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedSchema = formData.schema.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    handleInputChange("schema", updatedSchema);
  };

  const removeField = (index: number) => {
    const updatedSchema = formData.schema.filter((_, i) => i !== index);
    handleInputChange("schema", updatedSchema);
  };

  const exportSchemaToJSON = () => {
    const jsonString = JSON.stringify(formData.schema, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.slug || "form-schema"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Form schema exported successfully",
    });
  };

  const handleImportFields = (fields: FormField[]) => {
    handleInputChange("schema", fields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCardForm = formData.formType === "CARD";
    const validation = validateFormTemplate(
      formData.name,
      formData.slug,
      formData.title,
      formData.schema,
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

    // Validate all fields have labels (Simple Form only)
    const invalidFields = formData.schema.filter(
      (field) => !field.label?.trim()
    );
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
      const dataToSubmit = {
        ...formData,
        subAccountId: subAccountId ?? undefined,
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
  };

  // Step 1: Choose form type
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
              setFormData((prev) => ({ ...prev, formType: "SIMPLE" }));
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
              setFormData((prev) => ({ ...prev, formType: "CARD" }));
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
            setFormData((prev) => ({ ...prev, formType: "SIMPLE" }));
          }}
        >
          Change type
        </Button>
        <h1 className="text-2xl font-bold">
          Create New {isCardForm ? "Card Form" : "Simple Form"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormBasicInfoCard
          name={formData.name}
          slug={formData.slug}
          description={formData.description || ""}
          onNameChange={handleNameChange}
          onSlugChange={(slug) => handleInputChange("slug", slug)}
          onDescriptionChange={(description) =>
            handleInputChange("description", description)
          }
        />

        {/* Form Display Settings */}
        <FormDisplaySettingsCard
          title={formData.title || ""}
          subtitle={formData.subtitle || ""}
          submitButtonText={formData.submitButtonText}
          successMessage={formData.successMessage}
          isCardForm={isCardForm}
          onTitleChange={(title) => handleInputChange("title", title)}
          onSubtitleChange={(subtitle) =>
            handleInputChange("subtitle", subtitle)
          }
          onSubmitButtonTextChange={(text) =>
            handleInputChange("submitButtonText", text)
          }
          onSuccessMessageChange={(message) =>
            handleInputChange("successMessage", message)
          }
        />

        {/* Card Form Builder (Card Form only) */}
        {isCardForm && (
          <FormCardBuilderSection
            schema={formData.schema || []}
            cardSettings={
              formData.cardSettings as Record<string, unknown> | undefined
            }
            onSchemaChange={(newSchema) =>
              handleInputChange("schema", newSchema)
            }
            onCardSettingsChange={(settings) =>
              handleInputChange("cardSettings", settings)
            }
            description="Build your interactive card form using the flowchart editor. Preview will be available after you create the form."
          />
        )}

        {/* Profile Estimation (Card Form only) */}
        {isCardForm && (
          <FormProfileEstimationSection
            value={formData.profileEstimation as ProfileEstimation | undefined}
            fields={formData.schema || []}
            onChange={(config) =>
              handleInputChange(
                "profileEstimation",
                config as ProfileEstimation | undefined
              )
            }
          />
        )}

        {/* Form Fields (Simple Form only; Card Forms use the flowchart builder above) */}
        {!isCardForm && (
          <FormFieldsSection
            schema={formData.schema}
            onAddField={addField}
            onUpdateField={updateField}
            onRemoveField={removeField}
            onImportFields={handleImportFields}
            onExportSchema={exportSchemaToJSON}
          />
        )}

        {/* Advanced Settings */}
        <FormAdvancedSettingsCard
          requiresWakeUp={formData.requiresWakeUp || false}
          wakeUpInterval={formData.wakeUpInterval || 0}
          onRequiresWakeUpChange={(enabled) =>
            handleInputChange("requiresWakeUp", enabled)
          }
          onWakeUpIntervalChange={(interval) =>
            handleInputChange("wakeUpInterval", interval)
          }
        />

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Form Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
