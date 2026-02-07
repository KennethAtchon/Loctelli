import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(1, "Password is required"),
    company: z.string().optional(),
    role: z.enum(["user", "manager", "admin"]),
    bookingEnabled: z.number(),
    subAccountId: z.number(),
  })
  .refine((data) => data.subAccountId > 0, {
    message: "Please select a SubAccount",
    path: ["subAccountId"],
  });

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email")
    .optional(),
  role: z.enum(["user", "manager", "admin"]).optional(),
  company: z.string().optional(),
  isActive: z.boolean().optional(),
  bookingEnabled: z.number().optional(),
  bookingsTime: z
    .array(
      z.object({
        date: z.string(),
        slots: z.array(z.string()),
      })
    )
    .nullable()
    .optional(),
});

/** Form schema for edit user dialog (required name/email) */
export const editUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  role: z.enum(["user", "manager", "admin"]),
  company: z.string().optional(),
  isActive: z.boolean().optional(),
  bookingEnabled: z.number().optional(),
  bookingsTime: z
    .array(
      z.object({
        date: z.string(),
        slots: z.array(z.string()),
      })
    )
    .nullable()
    .optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
