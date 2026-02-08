"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

export function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-sm ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-muted"
      }`}
    >
      <div className="flex items-center gap-2">
        <Play className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">START</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </div>
  );
}
