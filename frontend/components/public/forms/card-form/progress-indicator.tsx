"use client";

import { Progress } from "@/components/ui/progress";

const CARD_FORM_SESSION_KEY = "card_form_session";

export function getCardFormSessionKey(slug: string) {
  return `${CARD_FORM_SESSION_KEY}_${slug}`;
}

interface ProgressIndicatorProps {
  current: number;
  total: number;
  style?: "bar" | "dots" | "numbers";
  className?: string;
}

export function ProgressIndicator({
  current,
  total,
  style = "bar",
  className,
}: ProgressIndicatorProps) {
  if (total <= 0) return null;

  const value = total > 0 ? Math.round((current / total) * 100) : 0;

  if (style === "numbers") {
    return (
      <div
        className={className}
        aria-label={`Question ${current + 1} of ${total}`}
      >
        <span className="text-sm font-medium text-muted-foreground">
          {current + 1} / {total}
        </span>
      </div>
    );
  }

  if (style === "dots") {
    return (
      <div
        className={`flex gap-1.5 ${className ?? ""}`}
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${current + 1} of ${total}`}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-200 ${
              i <= current ? "bg-primary w-5" : "bg-muted w-2"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <Progress value={value} className="h-2" />
      <span className="sr-only">
        Question {current + 1} of {total}
      </span>
    </div>
  );
}
