"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, GripVertical } from "lucide-react";
import type { FlowchartNode } from "@/lib/forms/flowchart-types";
import { START_NODE_ID, END_NODE_ID } from "@/lib/forms/flowchart-types";

// Use text/plain so getData() works on drop in all browsers
const DRAG_DATA_KEY = "text/plain";

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

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
    onReorder([START_NODE_ID, ...newOrder.map((n) => n.id), END_NODE_ID]);
  };

  const applyReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const newOrder = [...questionNodes];
      const [item] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, item);
      onReorder([START_NODE_ID, ...newOrder.map((n) => n.id), END_NODE_ID]);
    },
    [questionNodes, onReorder]
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData(DRAG_DATA_KEY, String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null) return;
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDropTargetIndex(null);
    setDraggedIndex(null);
    const raw = e.dataTransfer.getData(DRAG_DATA_KEY);
    if (raw === "") return;
    const dragIndex = parseInt(raw, 10);
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) return;
    applyReorder(dragIndex, dropIndex);
  };

  const handleButtonMoveUp = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    handleMove(index, "up");
  };

  const handleButtonMoveDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    handleMove(index, "down");
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
          const fieldType =
            node.data?.fieldType || node.data?.field?.type || "";
          const isDragging = draggedIndex === index;
          const isDropTarget = dropTargetIndex === index;

          return (
            <Card
              key={node.id}
              className={`cursor-pointer transition-colors ${
                isDragging ? "opacity-50" : "hover:bg-muted/50"
              } ${isDropTarget ? "ring-2 ring-primary" : ""}`}
              onClick={() => onNodeClick(node.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Drag to reorder, currently position ${index + 1}`}
                    className="cursor-grab active:cursor-grabbing touch-none rounded p-0.5 -m-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium truncate">
                        {label}
                      </span>
                      {fieldType && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({fieldType})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleButtonMoveUp(e, index)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleButtonMoveDown(e, index)}
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
