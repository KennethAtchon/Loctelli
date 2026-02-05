"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import type { ProfileEstimation } from "@/lib/forms/types";

export interface RecommendationResultProps {
  config: NonNullable<ProfileEstimation["recommendationConfig"]>;
  recommendations: Array<{
    recommendation: {
      id: string;
      name: string;
      description: string;
      image?: string;
      matchingCriteria: unknown[];
    };
    score: number;
  }>;
}

export function RecommendationResult({
  config,
  recommendations,
}: RecommendationResultProps) {
  if (!config) return null;

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {recommendations.map((item, index) => (
            <div
              key={item.recommendation.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start gap-4">
                {item.recommendation.image && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.recommendation.image}
                      alt={item.recommendation.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg">
                        {index + 1}. {item.recommendation.name}
                      </div>
                      {item.recommendation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.recommendation.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {item.score}% Match
                      </div>
                      <Progress value={item.score} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm">Book Now</Button>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
