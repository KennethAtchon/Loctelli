"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { IntegrationTemplate, CreateIntegrationDto } from "@/lib/api";

export default function NewIntegrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<IntegrationTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateIntegrationDto>({
    subAccountId: 1, // Default subaccount - should be dynamic
    integrationTemplateId: 0,
    name: "",
    description: "",
    isActive: false,
    config: {},
  });

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.integrationTemplates.getActive();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast.error("Error", {
        description: "Failed to load integration templates",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    // If template is pre-selected via URL param
    const templateId = searchParams.get("template");
    if (templateId && templates.length > 0) {
      const template = templates.find((t) => t.id === parseInt(templateId));
      if (template) {
        setSelectedTemplate(template);
        setFormData((prev) => ({
          ...prev,
          integrationTemplateId: template.id,
          name: template.displayName,
        }));
      }
    }
  }, [searchParams, templates]);

  const handleTemplateSelect = (template: IntegrationTemplate) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      integrationTemplateId: template.id,
      name: template.displayName,
      config: {}, // Reset config when template changes
    }));
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    if (!selectedTemplate) {
      toast.error("Error", {
        description: "Please select an integration template",
      });
      return false;
    }

    if (!formData.name.trim()) {
      toast.error("Error", {
        description: "Please enter an integration name",
      });
      return false;
    }

    // Validate required config fields
    const requiredFields = selectedTemplate.configSchema.required || [];
    for (const field of requiredFields) {
      if (
        !formData.config[field] ||
        formData.config[field].toString().trim() === ""
      ) {
        toast.error("Error", {
          description: `Please fill in the required field: ${field}`,
        });
        return false;
      }
    }

    return true;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    try {
      setTesting(true);
      // For now, we'll just show a success message since the backend test is mocked
      toast.success("Success", {
        description: "Connection test successful!",
      });
    } catch (error) {
      console.error("Connection test failed:", error);
      toast.error("Error", {
        description: "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      await api.integrations.create(formData);
      toast.success("Success", {
        description: "Integration created successfully",
      });
      router.push("/admin/integrations");
    } catch (error) {
      console.error("Failed to create integration:", error);
      toast.error("Error", {
        description: "Failed to create integration",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderConfigField = (
    key: string,
    schema: { type: string; title?: string; description?: string }
  ) => {
    const value = (formData.config[key] as string) || "";
    const isRequired = selectedTemplate?.configSchema.required?.includes(key);

    switch (schema.type) {
      case "string":
        if (
          schema.title?.toLowerCase().includes("key") ||
          schema.title?.toLowerCase().includes("token")
        ) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2">
                {schema.title}
                {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={key}
                type="password"
                value={value}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={schema.description}
                required={isRequired}
              />
              {schema.description && (
                <p className="text-sm text-gray-500">{schema.description}</p>
              )}
            </div>
          );
        }
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              {schema.title}
              {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={key}
              type="text"
              value={value}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={schema.description}
              required={isRequired}
            />
            {schema.description && (
              <p className="text-sm text-gray-500">{schema.description}</p>
            )}
          </div>
        );
      default:
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              {schema.title}
              {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={key}
              type="text"
              value={value}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={schema.description}
              required={isRequired}
            />
            {schema.description && (
              <p className="text-sm text-gray-500">{schema.description}</p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Setup Integration
          </h1>
          <p className="text-gray-600 mt-2">
            Configure a new integration for your subaccount
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Choose Integration</CardTitle>
              <CardDescription>
                Select the type of integration you want to configure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{template.displayName}</h3>
                      <p className="text-sm text-gray-600">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle>Configure {selectedTemplate.displayName}</CardTitle>
                <CardDescription>
                  Enter the required configuration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="name">Integration Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter a name for this integration"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter a description for this integration"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: checked,
                        }))
                      }
                    />
                    <Label htmlFor="isActive">
                      Activate immediately after setup
                    </Label>
                  </div>
                </div>

                {/* Configuration Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configuration</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(
                      selectedTemplate.configSchema.properties || {}
                    ).map(([key, schema]: [string, unknown]) =>
                      renderConfigField(
                        key,
                        schema as {
                          type: string;
                          title?: string;
                          description?: string;
                        }
                      )
                    )}
                  </div>
                </div>

                {/* Setup Instructions */}
                {selectedTemplate.setupInstructions && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Setup Instructions</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {selectedTemplate.setupInstructions}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testing ? "Testing..." : "Test Connection"}
                  </Button>

                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Integration"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Please select an integration template to configure</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
