import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from "react";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CreatePromptTemplateDto } from "@/lib/api/endpoints/prompt-templates";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute('/admin/content/prompt-templates/new')({
  component: NewPromptTemplatePage,
});

function NewPromptTemplatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreatePromptTemplateDto>({
    name: "",
    description: "",
    category: "",
    baseSystemPrompt: "",
    temperature: 0.7,
    maxTokens: undefined,
    isActive: false,
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    field: keyof CreatePromptTemplateDto,
    value: string | number | boolean | undefined | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      const newTags = [...(formData.tags || []), tagInput.trim()];
      handleInputChange("tags", newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = (formData.tags || []).filter((tag) => tag !== tagToRemove);
    handleInputChange("tags", newTags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.baseSystemPrompt.trim()) {
      toast.error("Name and Base System Prompt are required");
      return;
    }

    try {
      setLoading(true);

      // Ensure all required fields are present and properly formatted
      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        baseSystemPrompt: formData.baseSystemPrompt.trim(),
        temperature: formData.temperature || 0.7,
        maxTokens: formData.maxTokens || undefined,
        isActive: formData.isActive || false,
        tags: formData.tags || [],
      };

      console.log("Creating prompt template with data:", submitData);
      const result = await api.promptTemplates.create(submitData);
      console.log("Template created successfully:", result);
      toast.success("Template created successfully");
      navigate({ to: '/admin/content/prompt-templates' });
    } catch (error) {
      console.error("Failed to create template:", error);
      toast.error(`Failed to create template: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/content/prompt-templates' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            New Prompt Template
          </h1>
          <p className="text-gray-600 mt-2">
            Create a new AI prompt template with a minimal base system prompt
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Define the basic details of your prompt template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Sales Agent, Support Bot, Scheduler"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe the purpose and style of this template"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    placeholder="e.g., sales, support, scheduling"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Base System Prompt */}
            <Card>
              <CardHeader>
                <CardTitle>Base System Prompt *</CardTitle>
                <CardDescription>
                  ONE simple sentence that defines the AI's core behavior. Keep
                  it minimal - strategies will add detailed persona and
                  instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.baseSystemPrompt}
                  onChange={(e) =>
                    handleInputChange("baseSystemPrompt", e.target.value)
                  }
                  placeholder="You are a helpful AI assistant that guides conversations professionally."
                  rows={4}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Keep this short and simple. Detailed instructions, persona,
                  and conversation style will be defined in individual
                  strategies.
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add tags to categorize and organize templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Enter tag and press Add"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>AI Parameters</CardTitle>
                <CardDescription>
                  Configure the AI's behavior settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="flex items-center justify-between">
                    Temperature: {formData.temperature}
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Controls randomness. Lower = more focused, Higher = more
                    creative
                  </p>
                  <Slider
                    value={[formData.temperature || 0.7]}
                    onValueChange={(value) =>
                      handleInputChange("temperature", value[0])
                    }
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="maxTokens">Max Tokens (Optional)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Maximum length of AI responses
                  </p>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={formData.maxTokens || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "maxTokens",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="e.g., 1000"
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Configure template behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Set as Active</Label>
                    <p className="text-sm text-gray-500">
                      This template will be used as the default choice for new
                      strategies
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      "Creating..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Template
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate({ to: '/admin/content/prompt-templates' })}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

