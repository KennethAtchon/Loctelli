"use client";

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { toast } from "sonner";
import type { ProfileEstimation } from "@/lib/forms/types";

export interface PercentageResultProps {
  config: ProfileEstimation["percentageConfig"];
  score: number;
}

export function PercentageResult({ config, score }: PercentageResultProps) {
  const handleShareResult = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } else if (navigator.share) {
        await navigator.share({
          title: config?.title ?? "My result",
          text: `My score: ${score}%`,
          url,
        });
        toast.success("Shared");
      } else {
        toast.error("Sharing not supported in this browser");
      }
    } catch {
      toast.error("Could not copy link");
    }
  }, [config?.title, score]);

  const handleViewFullReport = useCallback(() => {
    window.print();
  }, []);

  if (!config) return null;

  const range =
    config.ranges.find((r) => score >= r.min && score <= r.max) ||
    config.ranges[0];

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
        {config.description && (
          <p className="text-muted-foreground mt-2">{config.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{score}%</div>
            <Progress value={score} className="h-4" />
          </div>

          {range && (
            <div className="space-y-3 text-center">
              <div className="text-xl font-semibold">{range.label}</div>
              {range.description && (
                <p className="text-muted-foreground">{range.description}</p>
              )}
              {range.image && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden mt-4">
                  <Image
                    src={range.image}
                    alt={range.label}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
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
        </div>
      </CardContent>
    </Card>
  );
}
