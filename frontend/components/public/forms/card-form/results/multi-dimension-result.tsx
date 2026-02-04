"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileEstimation } from "@/lib/api";

export interface MultiDimensionResultProps {
  config: ProfileEstimation["dimensionConfig"];
  scores: Record<string, number>;
}

export function MultiDimensionResult({
  config,
  scores,
}: MultiDimensionResultProps) {
  if (!config) return null;

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{config.title}</CardTitle>
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
      </CardContent>
    </Card>
  );
}
