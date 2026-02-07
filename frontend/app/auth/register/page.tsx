"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/unified-auth-context";
import { registerSchema, type RegisterFormValues } from "@/lib/forms/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import logger from "@/lib/logger";

const defaultValues: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  company: "",
  budget: "",
};

function usePasswordValidation(password: string) {
  return useMemo(
    () => ({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password]
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues,
  });
  const password = form.watch("password");
  const passwordValidation = usePasswordValidation(password ?? "");

  const handleSubmit = form.handleSubmit(async (data) => {
    logger.debug("🔐 Register form submitted:", { email: data.email });
    setError("");
    setSuccess("");
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        company: data.company,
        budget: data.budget,
      });
      logger.debug("✅ Registration successful");
      setSuccess(
        "Registration successful! You have been automatically logged in."
      );
      form.reset(defaultValues);
      setTimeout(() => router.push("/account"), 2000);
    } catch (err) {
      logger.error("❌ Registration failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    }
  });

  const isLoading = form.formState.isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create a new account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                      <br />
                      <small className="text-xs opacity-75">
                        Debug: Error state is active
                      </small>
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your full name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {password && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Password Requirements:
                          </p>
                          <div className="space-y-1">
                            <div
                              className={`flex items-center text-xs ${passwordValidation.hasMinLength ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasMinLength ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              At least 8 characters
                            </div>
                            <div
                              className={`flex items-center text-xs ${passwordValidation.hasUppercase ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasUppercase ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              At least one uppercase letter
                            </div>
                            <div
                              className={`flex items-center text-xs ${passwordValidation.hasLowercase ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasLowercase ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              At least one lowercase letter
                            </div>
                            <div
                              className={`flex items-center text-xs ${passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasNumber ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              At least one number
                            </div>
                            <div
                              className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasSpecialChar ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              At least one special character
                            </div>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your company name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your budget range"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
