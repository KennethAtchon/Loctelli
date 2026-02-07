import { z } from "zod";

export const createPromptTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  baseSystemPrompt: z.string().min(1, "Base system prompt is required"),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const updatePromptTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  baseSystemPrompt: z
    .string()
    .min(1, "Base system prompt is required")
    .optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

/** Form schema for edit prompt template page (required name + baseSystemPrompt) */
export const editPromptTemplateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  baseSystemPrompt: z.string().min(1, "Base system prompt is required"),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreatePromptTemplateFormValues = z.infer<
  typeof createPromptTemplateSchema
>;
export type UpdatePromptTemplateFormValues = z.infer<
  typeof updatePromptTemplateSchema
>;
export type EditPromptTemplateFormValues = z.infer<
  typeof editPromptTemplateFormSchema
>;
