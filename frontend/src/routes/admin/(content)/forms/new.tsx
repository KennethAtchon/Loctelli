import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  FileJson,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  CreateFormTemplateDto,
  FormField,
} from "@/lib/api/endpoints/forms";
import { ROUTES } from "@/lib/routes";

export const Route = createFileRoute(ROUTES.ADMIN.FORM_NEW)({
  component: NewFormTemplatePage,
});

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

function NewFormTemplatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateFormTemplateDto>({
    name: "",
    slug: "",
    description: "",
    schema: [],
    title: "",
    subtitle: "",
    submitButtonText: "Submit",
    successMessage: "Thank you for your submission!",
    requiresWakeUp: true,
    wakeUpInterval: 30,
  });
  const [loading, setLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonImport, setShowJsonImport] = useState(false);

  const handleInputChange = (
    field: keyof CreateFormTemplateDto,
    value: string | number | boolean | FormField[] | undefined,
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
    // Auto-generate slug if it's empty or matches previous auto-generated one
    if (!formData.slug || formData.slug === generateSlug(formData.name)) {
      handleInputChange("slug", generateSlug(name));
    }
    // Auto-fill title if it's empty or matches the previous name
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
      i === index ? { ...field, ...updates } : field,
    );
    handleInputChange("schema", updatedSchema);
  };

  const removeField = (index: number) => {
    const updatedSchema = formData.schema.filter((_, i) => i !== index);
    handleInputChange("schema", updatedSchema);
  };

  const addOption = (fieldIndex: number) => {
    const field = formData.schema[fieldIndex];
    const options = field.options || [];
    updateField(fieldIndex, { options: [...options, ""] });
  };

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const field = formData.schema[fieldIndex];
    const options = field.options || [];
    const updatedOptions = options.map((opt, i) =>
      i === optionIndex ? value : opt,
    );
    updateField(fieldIndex, { options: updatedOptions });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = formData.schema[fieldIndex];
    const options = field.options || [];
    const updatedOptions = options.filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options: updatedOptions });
  };

  // JSON Import/Export functions
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
    toast.success("Form schema exported successfully");
  };

  const importSchemaFromJSON = () => {
    try {
      const parsedSchema = JSON.parse(jsonInput);

      // Validate the parsed JSON
      if (!Array.isArray(parsedSchema)) {
        throw new Error("JSON must be an array of form fields");
      }

      // Validate each field in the schema
      for (const field of parsedSchema) {
        if (!field.id || !field.type || !field.label) {
          throw new Error(
            "Each field must have id, type, and label properties",
          );
        }

        const validTypes = fieldTypes.map((t) => t.value);
        if (!validTypes.includes(field.type)) {
          throw new Error(
            `Invalid field type: ${field.type}. Valid types are: ${validTypes.join(", ")}`,
          );
        }
      }

      // Assign unique IDs if they don't exist or are duplicated
      const usedIds = new Set();
      const schemaWithUniqueIds = parsedSchema.map(
        (field: FormField, index: number) => {
          let fieldId = field.id;
          if (!fieldId || usedIds.has(fieldId)) {
            fieldId = `field_${Date.now()}_${index}`;
          }
          usedIds.add(fieldId);
          return { ...field, id: fieldId };
        },
      );

      handleInputChange("schema", schemaWithUniqueIds);
      setJsonInput("");
      setShowJsonImport(false);
      toast.success(
        `Imported ${schemaWithUniqueIds.length} form fields successfully`,
      );
    } catch (error: any) {
      toast.error(error.message || "Invalid JSON format");
    }
  };

  const getExampleJSON = () => {
    return JSON.stringify(
      [
        {
          id: "name",
          type: "text",
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          placeholder: "Enter your email",
          required: true,
        },
        {
          id: "phone",
          type: "phone",
          label: "Phone Number",
          placeholder: "Enter your phone number",
          required: false,
        },
        {
          id: "message",
          type: "textarea",
          label: "Message",
          placeholder: "Enter your message",
          required: true,
        },
        {
          id: "service",
          type: "select",
          label: "Service Interest",
          options: ["Web Design", "SEO", "Marketing", "Consulting"],
          required: true,
        },
      ],
      null,
      2,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name?.trim() ||
      !formData.slug?.trim() ||
      !formData.title?.trim()
    ) {
      toast.error("Name, slug, and title are required");
      return;
    }

    if (formData.schema.length === 0) {
      toast.error("At least one form field is required");
      return;
    }

    // Validate all fields have labels
    const invalidFields = formData.schema.filter(
      (field) => !field.label.trim(),
    );
    if (invalidFields.length > 0) {
      toast.error("All form fields must have labels");
      return;
    }

    setLoading(true);
    try {
      await api.forms.createFormTemplate(formData);
      toast.success("Form template created successfully");
      navigate({ to: "/admin/forms" });
    } catch (error: any) {
      console.error("Failed to create form template:", error);
      toast.error(error.message || "Failed to create form template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/admin/forms" })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Create Form Template</h1>
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

        {/* Form Fields */}
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
                <Dialog open={showJsonImport} onOpenChange={setShowJsonImport}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import JSON
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Import Form Fields from JSON</DialogTitle>
                      <DialogDescription>
                        Paste your JSON schema below to bulk import form fields.
                        This will replace existing fields.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="jsonInput">JSON Schema</Label>
                        <Textarea
                          id="jsonInput"
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          placeholder="Paste your JSON schema here..."
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setJsonInput(getExampleJSON())}
                        >
                          <FileJson className="h-4 w-4 mr-2" />
                          Load Example
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setJsonInput("");
                              setShowJsonImport(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={importSchemaFromJSON}
                            disabled={!jsonInput.trim()}
                          >
                            Import Fields
                          </Button>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">
                          Expected JSON Format:
                        </h4>
                        <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border overflow-x-auto">
                          {`[
  {
    "id": "field_id",
    "type": "text|email|phone|textarea|select|checkbox|radio|file|image",
    "label": "Field Label",
    "placeholder": "Optional placeholder",
    "required": true|false,
    "options": ["Option 1", "Option 2"] // For select/radio only
  }
]`}
                        </pre>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-medium">Field {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          updateField(index, {
                            type: value as FormField["type"],
                          })
                        }
                      >
                        <SelectTrigger>
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
                    <div>
                      <Label>Field Label *</Label>
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateField(index, { label: e.target.value })
                        }
                        placeholder="Enter field label"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Placeholder Text</Label>
                      <Input
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          updateField(index, { placeholder: e.target.value })
                        }
                        placeholder="Enter placeholder text"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.required || false}
                        onCheckedChange={(checked) =>
                          updateField(index, { required: checked })
                        }
                      />
                      <Label>Required Field</Label>
                    </div>
                  </div>

                  {(field.type === "select" || field.type === "radio") && (
                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {(field.options || []).map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-2"
                          >
                            <Input
                              value={option}
                              onChange={(e) =>
                                updateOption(index, optionIndex, e.target.value)
                              }
                              placeholder="Enter option"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(index, optionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(index)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {formData.schema.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No fields added yet. Click "Add Field" to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Additional configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.requiresWakeUp}
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
                      parseInt(e.target.value),
                    )
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/admin/forms" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Form"}
          </Button>
        </div>
      </form>
    </div>
  );
}
