"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import type { ProfileEstimation } from "@/lib/forms/types";

export interface PercentageResultProps {
  config: ProfileEstimation["percentageConfig"];
  score: number;
}

export function PercentageResult({ config, score }: PercentageResultProps) {
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
        </div>
      </CardContent>
    </Card>
  );
}
