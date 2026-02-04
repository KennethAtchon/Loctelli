"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Download,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useTenant } from "@/contexts/tenant-context";
import { FormFieldEditor } from "@/components/admin/forms/form-field-editor";
import { JsonImportDialog } from "@/components/admin/forms/json-import-dialog";
import { CardFormBuilder } from "@/components/admin/forms/card-form-builder";
import { ProfileEstimationSetup } from "@/components/admin/forms/profile-estimation/setup-wizard";
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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

    if (
      !formData.name.trim() ||
      !formData.slug.trim() ||
      !formData.title.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "Name, slug, and title are required",
        variant: "destructive",
      });
      return;
    }

    const isSimpleForm = formData.formType !== "CARD";
    if (isSimpleForm && formData.schema.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one form field is required for Simple Forms",
        variant: "destructive",
      });
      return;
    }

    // Validate all fields have labels (Simple Form only)
    const invalidFields = formData.schema.filter(
      (field) => !field.label?.trim()
    );
    if (isSimpleForm && invalidFields.length > 0) {
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
          Form shows one question per screen with an interactive flowchart builder.
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
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Basic details about your form template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Form Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Contact Form, Lead Capture"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="e.g., contact-form"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Brief description of this form template"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Form Display Settings</CardTitle>
            <CardDescription>How the form appears to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Title shown to users"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder="Optional subtitle or description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="submitButtonText">Submit Button Text</Label>
                <Input
                  id="submitButtonText"
                  value={formData.submitButtonText}
                  onChange={(e) =>
                    handleInputChange("submitButtonText", e.target.value)
                  }
                  placeholder="Submit"
                />
              </div>
              <div>
                <Label htmlFor="successMessage">Success Message</Label>
                <Input
                  id="successMessage"
                  value={formData.successMessage}
                  onChange={(e) =>
                    handleInputChange("successMessage", e.target.value)
                  }
                  placeholder="Thank you for your submission!"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Form Builder (Card Form only) */}
        {isCardForm && (
          <Card>
            <CardHeader>
              <CardTitle>Card Form Builder</CardTitle>
              <CardDescription>
                Build your interactive card form using the flowchart editor.
                Preview will be available after you create the form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardFormBuilder
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
              />
            </CardContent>
          </Card>
        )}

        {/* Profile Estimation (Card Form only) */}
        {isCardForm && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Estimation</CardTitle>
              <CardDescription>
                Configure personalized results based on user answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileEstimationSetup
                value={
                  formData.profileEstimation as ProfileEstimation | undefined
                }
                fields={formData.schema || []}
                onChange={(config) =>
                  handleInputChange(
                    "profileEstimation",
                    config as ProfileEstimation | undefined
                  )
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Form Fields (Simple Form only; Card Forms use the flowchart builder above) */}
        {!isCardForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Form Fields
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportSchemaToJSON}
                    disabled={formData.schema.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <JsonImportDialog onImport={handleImportFields} />
                  <Button type="button" onClick={addField} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Define the fields that users will fill out. Use JSON import for
                bulk operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.schema.map((field, index) => (
                <FormFieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  onUpdate={(updates) => updateField(index, updates)}
                  onRemove={() => removeField(index)}
                />
              ))}

              {formData.schema.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No fields added yet. Click "Add Field" to get started.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Additional configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.requiresWakeUp || false}
                onCheckedChange={(checked) =>
                  handleInputChange("requiresWakeUp", checked)
                }
              />
              <Label>Enable Database Wake-up</Label>
            </div>
            {formData.requiresWakeUp && (
              <div>
                <Label htmlFor="wakeUpInterval">
                  Wake-up Interval (seconds)
                </Label>
                <Input
                  id="wakeUpInterval"
                  type="number"
                  min="10"
                  value={formData.wakeUpInterval}
                  onChange={(e) =>
                    handleInputChange(
                      "wakeUpInterval",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

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
