"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface LabelWithTooltipProps {
  label: React.ReactNode;
  tooltip: string;
  htmlFor?: string;
  className?: string;
}

/** Label with an optional info icon that shows a tooltip on hover. */
export function LabelWithTooltip({
  label,
  tooltip,
  htmlFor,
  className,
}: LabelWithTooltipProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="More info"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/** Section heading with tooltip (e.g. "Score Ranges", "Field Scoring"). */
export function SectionHeadingWithTooltip({
  children,
  tooltip,
  className,
}: {
  children: React.ReactNode;
  tooltip: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="More info"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
