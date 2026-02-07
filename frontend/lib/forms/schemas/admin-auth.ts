import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const adminRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "At least 8 characters"),
  authCode: z.string().min(1, "Authorization code is required"),
  role: z.enum(["admin", "super_admin"]),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
export type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>;
