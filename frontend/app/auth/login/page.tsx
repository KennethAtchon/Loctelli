"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUnifiedAuth } from "@/contexts/unified-auth-context";
import { loginSchema, type LoginFormValues } from "@/lib/forms/schemas";
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
import logger from "@/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, isAuthenticated, isLoading, isAdmin } = useUnifiedAuth();
  const [error, setError] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    logger.debug("🔍 Error state changed:", error);
  }, [error]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isAdmin()) {
        router.push("/admin/dashboard");
      } else {
        router.push("/account");
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        logger.warn("Auth loading timeout - forcing loading state to false");
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const [forceShowForm, setForceShowForm] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        logger.warn("Forcing form display after 15 seconds");
        setForceShowForm(true);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const timestamp = new Date().toISOString();
    logger.debug(`🔐 Login form submitted at ${timestamp}:`, {
      email: data.email,
    });
    setError("");
    try {
      logger.debug("🧪 Testing login with credentials...");
      await loginUser({ email: data.email, password: data.password });
      logger.debug("✅ Login successful, redirecting...");
      router.push("/account");
    } catch (err) {
      logger.error("❌ Login failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
      setTimeout(
        () => logger.debug("⏰ Error state should be visible now"),
        100
      );
    }
  });

  useEffect(() => {
    logger.debug("🔄 Form state changed:", {
      isSubmitting: form.formState.isSubmitting,
      error,
      isAuthenticated,
      isLoading,
    });
  }, [form.formState.isSubmitting, error, isAuthenticated, isLoading]);

  if (isLoading && !forceShowForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                noValidate
                onKeyDown={(e) => {
                  if (e.key === "Enter") logger.debug("🔑 Enter key pressed");
                }}
              >
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
                          disabled={isSubmitting}
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
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
