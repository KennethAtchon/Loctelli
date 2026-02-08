"use client";

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import type { ProfileEstimation } from "@/lib/forms/types";

export interface CategoryResultProps {
  config: NonNullable<ProfileEstimation["categoryConfig"]>;
  category: {
    id: string;
    name: string;
    description: string;
    image?: string;
    matchingLogic: unknown[];
  };
  confidence: number;
}

export function CategoryResult({
  config,
  category,
  confidence,
}: CategoryResultProps) {
  const handleShareResult = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } else if (navigator.share) {
        await navigator.share({
          title: config?.title ?? "My result",
          text: `I got "${category.name}" — ${category.description ?? ""}`,
          url,
        });
        toast.success("Shared");
      } else {
        toast.error("Sharing not supported in this browser");
      }
    } catch {
      toast.error("Could not copy link");
    }
  }, [config?.title, category.name, category.description]);

  const handleViewFullReport = useCallback(() => {
    window.print();
  }, []);

  if (!config) return null;

  const resultStyle: React.CSSProperties = {
    maxWidth: "var(--form-result-max-width, 48rem)",
    marginLeft: "auto",
    marginRight: "auto",
  };
  const titleStyle: React.CSSProperties = {
    fontSize: "var(--form-result-title-font-size, 1.5rem)",
  };

  return (
    <Card className="w-full" style={resultStyle}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl" style={titleStyle}>
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 text-center">
          {category.image && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden mx-auto max-w-md">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="text-3xl font-bold">{category.name}</div>
            {category.description && (
              <p className="text-muted-foreground text-lg">
                {category.description}
              </p>
            )}
            <div className="text-sm text-muted-foreground mt-2">
              Match: {confidence}%
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-4 print:hidden">
            <Button variant="outline" onClick={handleShareResult}>
              Share Result
            </Button>
            <Button variant="outline" onClick={handleViewFullReport}>
              View Full Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
