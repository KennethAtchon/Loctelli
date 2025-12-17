"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/unified-auth-context";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminProtectedRoute({
  children,
  fallback,
}: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication or during redirect
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="relative">
            {/* Outer ring */}
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 dark:border-slate-700"></div>
            {/* Inner spinning ring */}
            <div className="absolute inset-0 animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-blue-600 border-r-blue-500"></div>
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          {/* Loading text */}
          <div className="mt-6 text-slate-600 dark:text-slate-400 font-medium">
            Loading...
          </div>
          {/* Subtle pulsing dots */}
          <div className="flex space-x-1 mt-4">
            <div
              className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
