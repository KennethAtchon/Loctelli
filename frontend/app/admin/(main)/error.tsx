"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" aria-hidden />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {error.message || "An error occurred while loading this page."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={reset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
