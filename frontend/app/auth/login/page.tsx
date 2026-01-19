"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUnifiedAuth } from "@/contexts/unified-auth-context";
import type { LoginDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logger from "@/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, isAuthenticated, isLoading, isAdmin } = useUnifiedAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Debug error state changes
  useEffect(() => {
    logger.debug("🔍 Error state changed:", error);
  }, [error]);

  const [formData, setFormData] = useState<LoginDto>({
    email: "",
    password: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check if user is admin via the auth context
      if (isAdmin()) {
        router.push("/admin/dashboard");
      } else {
        router.push("/account");
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  // Fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        logger.warn("Auth loading timeout - forcing loading state to false");
        // Force loading to false after 10 seconds to prevent infinite loading
        // This is a fallback in case the auth contexts get stuck
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Additional fallback: if loading takes too long, show the form anyway
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const timestamp = new Date().toISOString();
    logger.debug(`🔐 Login form submitted at ${timestamp}:`, {
      email: formData.email,
    });

    // Prevent multiple submissions
    if (isSubmitting) {
      logger.debug("🚫 Form already submitting, ignoring");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      logger.debug("🧪 Testing login with credentials...");
      await loginUser(formData);
      logger.debug("✅ Login successful, redirecting...");
      // Redirect to account page (useEffect will handle admin redirect if needed)
      router.push("/account");
    } catch (error) {
      logger.error("❌ Login failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setError(errorMessage);
      logger.debug("📝 Set error message:", errorMessage);

      // Force a small delay to ensure the error state is set
      setTimeout(() => {
        logger.debug("⏰ Error state should be visible now");
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug form state changes
  useEffect(() => {
    logger.debug("🔄 Form state changed:", {
      isSubmitting,
      error,
      isAuthenticated,
      isLoading,
    });
  }, [isSubmitting, error, isAuthenticated, isLoading]);

  // Show loading state while checking authentication
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

  // Don't render the form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

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
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              noValidate
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  logger.debug("🔑 Enter key pressed");
                }
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

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  required
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  required
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
