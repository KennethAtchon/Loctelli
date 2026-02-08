"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Trophy } from "lucide-react";
import type { FlowchartNodeData } from "@/lib/forms/flowchart-types";

export function ResultNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowchartNodeData;
  const label = nodeData?.label || "Results";

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-sm min-w-[180px] ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-muted"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-start gap-2">
        <Trophy className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">
            Profile Result
          </div>
          <div className="text-sm font-medium truncate">{label}</div>
        </div>
      </div>
    </div>
  );
}
