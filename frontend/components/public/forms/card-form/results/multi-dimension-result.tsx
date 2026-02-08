"use client";

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { ProfileEstimation } from "@/lib/forms/types";

export interface MultiDimensionResultProps {
  config: ProfileEstimation["dimensionConfig"];
  scores: Record<string, number>;
}

export function MultiDimensionResult({
  config,
  scores,
}: MultiDimensionResultProps) {
  const handleShareResult = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } else if (navigator.share) {
        await navigator.share({
          title: config?.title ?? "My result",
          text: "View my full profile report",
          url,
        });
        toast.success("Shared");
      } else {
        toast.error("Sharing not supported in this browser");
      }
    } catch {
      toast.error("Could not copy link");
    }
  }, [config?.title]);

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
        <div className="space-y-4">
          {config.dimensions.map((dimension) => {
            const score = scores[dimension.id] || 0;
            return (
              <div key={dimension.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dimension.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {score}%
                  </span>
                </div>
                <Progress value={score} className="h-3" />
              </div>
            );
          })}
        </div>

        {config.visualization === "radar" && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/30 text-center text-sm text-muted-foreground">
            Radar chart visualization coming soon
          </div>
        )}

        {config.visualization === "pie" && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/30 text-center text-sm text-muted-foreground">
            Pie chart visualization coming soon
          </div>
        )}

        <div className="flex gap-2 justify-center pt-4 print:hidden">
          <Button variant="outline" onClick={handleShareResult}>
            Share Result
          </Button>
          <Button variant="outline" onClick={handleViewFullReport}>
            View Full Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
