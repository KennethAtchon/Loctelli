"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { CheckCircle } from "lucide-react";

export function EndNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-sm ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-muted"
      }`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="font-semibold text-sm">END</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
    </div>
  );
}
