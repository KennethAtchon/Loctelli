"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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

          <div className="flex gap-2 justify-center pt-4">
            <Button variant="outline">Share Result</Button>
            <Button variant="outline">View Full Report</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
