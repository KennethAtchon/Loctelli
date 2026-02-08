"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import {
  createPromptTemplateSchema,
  type CreatePromptTemplateFormValues,
} from "@/lib/forms/schemas";

const defaultValues: CreatePromptTemplateFormValues = {
  name: "",
  description: "",
  category: "",
  baseSystemPrompt: "",
  temperature: 0.7,
  maxTokens: undefined,
  isActive: false,
  tags: [],
};

export default function NewPromptTemplatePage() {
  const [tagInput, setTagInput] = useState("");
  const router = useRouter();

  const form = useForm<CreatePromptTemplateFormValues>({
    resolver: zodResolver(createPromptTemplateSchema),
    defaultValues,
  });

  const tags = form.watch("tags") ?? [];
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      form.setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const submitData: CreatePromptTemplateDto = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        category: data.category?.trim() || undefined,
        baseSystemPrompt: data.baseSystemPrompt.trim(),
        temperature: data.temperature ?? 0.7,
        maxTokens: data.maxTokens ?? undefined,
        isActive: data.isActive ?? false,
        tags: data.tags ?? [],
      };
      await api.promptTemplates.create(submitData);
      toast.success("Success", {
        description: "Template created successfully",
      });
      router.push("/admin/prompt-templates");
    } catch (error) {
      toast.error("Error", {
        description: `Failed to create template: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  });

  const loading = form.formState.isSubmitting;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
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

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Define the basic details of your prompt template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Sales Agent, Support Bot, Scheduler"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the purpose and style of this template"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., sales, support, scheduling"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Base System Prompt *</CardTitle>
                  <CardDescription>
                    ONE simple sentence that defines the AI's core behavior.
                    Keep it minimal - strategies will add detailed persona and
                    instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="baseSystemPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="You are a helpful AI assistant that guides conversations professionally."
                            rows={4}
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500 mt-2">
                          Keep this short and simple. Detailed instructions,
                          persona, and conversation style will be defined in
                          individual strategies.
                        </p>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

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

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
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

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Parameters</CardTitle>
                  <CardDescription>
                    Configure the AI's behavior settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          Temperature: {field.value}
                        </FormLabel>
                        <p className="text-xs text-gray-500 mb-2">
                          Controls randomness. Lower = more focused, Higher =
                          more creative
                        </p>
                        <FormControl>
                          <Slider
                            value={[field.value ?? 0.7]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={2}
                            min={0}
                            step={0.1}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens (Optional)</FormLabel>
                        <p className="text-xs text-gray-500 mb-2">
                          Maximum length of AI responses
                        </p>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                            placeholder="e.g., 1000"
                            min={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Template Settings</CardTitle>
                  <CardDescription>Configure template behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">
                            Set as Active
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            This template will be used as the default choice for
                            new strategies
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

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
                      onClick={() => router.back()}
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
      </Form>
    </div>
  );
}
