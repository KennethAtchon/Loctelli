"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Info } from "lucide-react";
import type { FlowchartNodeData } from "@/lib/forms/flowchart-types";

export function StatementNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowchartNodeData;
  const text = nodeData?.statementText || nodeData?.label || "Statement";

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-sm min-w-[180px] ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-muted"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">Info</div>
          <div className="text-sm font-medium truncate">{text}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </div>
  );
}
