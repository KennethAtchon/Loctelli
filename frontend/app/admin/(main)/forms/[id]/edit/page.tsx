"use client";

import { useState, useEffect } from "react";
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
import type {
  FormTemplate,
  UpdateFormTemplateDto,
  FormField,
  ProfileEstimation,
} from "@/lib/forms/types";
import { FormFieldsSection } from "@/components/admin/forms/form-sections/form-fields-section";
import { FormBasicInfoCard } from "@/components/admin/forms/form-sections/form-basic-info-card";
import { FormDisplaySettingsCard } from "@/components/admin/forms/form-sections/form-display-settings-card";
import { FormAdvancedSettingsCard } from "@/components/admin/forms/form-sections/form-advanced-settings-card";
import { FormCardBuilderSection } from "@/components/admin/forms/form-sections/form-card-builder-section";
import { FormProfileEstimationSection } from "@/components/admin/forms/form-sections/form-profile-estimation-section";
import { AnalyticsDashboard } from "@/components/admin/forms/analytics-dashboard";
import { generateSlug, validateFormTemplate } from "@/lib/forms/form-utils";

export default function EditFormTemplatePage() {
  const params = useParams();
  const formId = params.id as string;
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [formData, setFormData] = useState<UpdateFormTemplateDto>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const loadTemplate = async () => {
    try {
      const templateData = await api.forms.getFormTemplate(formId);
      setTemplate(templateData);
      setFormData({
        name: templateData.name,
        slug: templateData.slug,
        description: templateData.description,
        formType: templateData.formType,
        schema: templateData.schema,
        title: templateData.title,
        subtitle: templateData.subtitle,
        submitButtonText: templateData.submitButtonText,
        successMessage: templateData.successMessage,
        isActive: templateData.isActive,
        requiresWakeUp: templateData.requiresWakeUp,
        wakeUpInterval: templateData.wakeUpInterval,
        cardSettings: templateData.cardSettings,
        profileEstimation: templateData.profileEstimation,
        styling: templateData.styling,
        analyticsEnabled: templateData.analyticsEnabled,
      });
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

  const handleInputChange = (
    field: keyof UpdateFormTemplateDto,
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
    // Only auto-update slug if it matches the current auto-generated slug
    if (template && formData.slug === generateSlug(template.name)) {
      handleInputChange("slug", generateSlug(name));
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "",
      required: false,
    };
    const currentSchema = formData.schema || [];
    handleInputChange("schema", [...currentSchema, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const currentSchema = formData.schema || [];
    const updatedSchema = currentSchema.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    handleInputChange("schema", updatedSchema);
  };

  const removeField = (index: number) => {
    const currentSchema = formData.schema || [];
    const updatedSchema = currentSchema.filter((_, i) => i !== index);
    handleInputChange("schema", updatedSchema);
  };

  // JSON Export function
  const exportSchemaToJSON = () => {
    const currentSchema = formData.schema || [];
    const jsonString = JSON.stringify(currentSchema, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.slug || template?.slug || "form-schema"}.json`;
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
      formData.name || "",
      formData.slug || "",
      formData.title || "",
      formData.schema || [],
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
    const currentSchema = formData.schema || [];
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
      await api.forms.updateFormTemplate(formId, formData);

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
  };

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
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              handleInputChange("isActive", checked)
            }
          />
          <Label className="ml-2">Active</Label>
        </div>
      </div>

      {isCardForm && (
        <FormCardBuilderSection
          schema={formData.schema || []}
          cardSettings={
            formData.cardSettings as Record<string, unknown> | undefined
          }
          onSchemaChange={(newSchema) => handleInputChange("schema", newSchema)}
          onCardSettingsChange={(settings) =>
            handleInputChange("cardSettings", settings)
          }
          formSlug={formData.slug || template?.slug}
        />
      )}

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

      {/* Analytics Dashboard */}
      {formData.analyticsEnabled && (
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
        {/* Basic Information */}
        <FormBasicInfoCard
          name={formData.name || ""}
          slug={formData.slug || ""}
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

        {/* Form Fields (Simple Form only; Card Forms use the flowchart builder above) */}
        {!isCardForm && (
          <FormFieldsSection
            schema={formData.schema || []}
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
          wakeUpInterval={formData.wakeUpInterval || 30}
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
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
