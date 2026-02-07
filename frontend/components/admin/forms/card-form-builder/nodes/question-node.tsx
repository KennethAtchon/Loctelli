"use client";

import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { FileQuestion } from "lucide-react";
import type { FlowchartNodeData } from "@/lib/forms/flowchart-types";

const fieldTypeIcons: Record<string, string> = {
  text: "Aa",
  textarea: "📝",
  select: "▼",
  radio: "○",
  checkbox: "☑",
  file: "📎",
  image: "🖼",
};

export function QuestionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowchartNodeData;
  const label = nodeData?.label || nodeData?.field?.label || "Question";
  const fieldType = nodeData?.fieldType || nodeData?.field?.type || "text";
  const icon = fieldTypeIcons[fieldType] || "?";

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-sm min-w-[180px] ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-muted"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-start gap-2">
        <FileQuestion className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">
            {icon} {fieldType}
          </div>
          <div className="text-sm font-medium truncate">{label}</div>
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
