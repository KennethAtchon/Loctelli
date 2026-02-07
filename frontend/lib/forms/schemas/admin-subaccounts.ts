import { z } from "zod";

export const createSubAccountSchema = z.object({
  name: z.string().min(1, "SubAccount name is required"),
  description: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const updateSubAccountSchema = z.object({
  name: z.string().min(1, "SubAccount name is required").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

/** Form schema for edit subaccount dialog (required name) */
export const editSubAccountFormSchema = z.object({
  name: z.string().min(1, "SubAccount name is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

export type CreateSubAccountFormValues = z.infer<typeof createSubAccountSchema>;
export type UpdateSubAccountFormValues = z.infer<typeof updateSubAccountSchema>;
export type EditSubAccountFormValues = z.infer<typeof editSubAccountFormSchema>;
