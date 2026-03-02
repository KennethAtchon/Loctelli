"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/unified-auth-context";
import { getLoginPathForCurrentRoute } from "@/lib/session-expiration";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const loginPath = getLoginPathForCurrentRoute(pathname);
      router.push(loginPath);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show loading state while checking authentication or during redirect
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
