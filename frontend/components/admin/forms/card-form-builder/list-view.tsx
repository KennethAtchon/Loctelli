"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, GripVertical } from "lucide-react";
import type { FlowchartNode } from "@/lib/forms/flowchart-types";
import { START_NODE_ID, END_NODE_ID } from "@/lib/forms/flowchart-types";

export interface ListViewProps {
  nodes: FlowchartNode[];
  onNodeClick: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function ListView({
  nodes,
  onNodeClick,
  onNodeDelete,
  onReorder,
}: ListViewProps) {
  const questionNodes = nodes.filter(
    (n) => n.type === "question" || n.type === "statement"
  );

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questionNodes.length - 1) return;
    const newOrder = [...questionNodes];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newOrder[index], newOrder[swapIndex]] = [
      newOrder[swapIndex],
      newOrder[index],
    ];
    const orderedIds = [
      START_NODE_ID,
      ...newOrder.map((n) => n.id),
      END_NODE_ID,
    ];
    onReorder(orderedIds);
  };

  return (
    <div className="space-y-2">
      {questionNodes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No questions yet. Add a question to get started.
          </CardContent>
        </Card>
      ) : (
        questionNodes.map((node, index) => {
          const label =
            node.type === "statement"
              ? node.data?.statementText || node.data?.label || "Statement"
              : node.data?.label || node.data?.field?.label || "Question";
          const fieldType = node.data?.fieldType || node.data?.field?.type || "";

          return (
            <Card
              key={node.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNodeClick(node.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium">{label}</span>
                      {fieldType && (
                        <span className="text-xs text-muted-foreground">
                          ({fieldType})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(index, "up");
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(index, "down");
                      }}
                      disabled={index === questionNodes.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNodeDelete(node.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
