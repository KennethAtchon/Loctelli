"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  RotateCcw, 
  Check, 
  X, 
  Clock,
  FileText,
  Sparkles
} from "lucide-react";

interface Change {
  id: string;
  timestamp: Date;
  description: string;
  prompt: string;
  file: string;
  status: 'applied' | 'reverted' | 'pending';
  modifications: any;
}

interface ChangeHistoryProps {
  changes: Change[];
  onRevert: (changeId: string) => void;
  onApply: (changeId: string) => void;
}

export function ChangeHistory({ changes, onRevert, onApply }: ChangeHistoryProps) {
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: Change['status']) => {
    switch (status) {
      case 'applied': return 'bg-green-100 text-green-700';
      case 'reverted': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: Change['status']) => {
    switch (status) {
      case 'applied': return <Check className="h-3 w-3" />;
      case 'reverted': return <X className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <History className="mr-2 h-4 w-4" />
          Change History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {changes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No changes yet</p>
            <p className="text-xs">AI modifications will appear here</p>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Change List */}
            <div className="w-1/2 border-r">
              <ScrollArea className="h-[400px]">
                <div className="p-2 space-y-2">
                  {changes.map((change) => (
                    <div
                      key={change.id}
                      onClick={() => setSelectedChange(change)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedChange?.id === change.id 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-3 w-3 text-gray-500" />
                          <span className="text-xs font-medium">{change.file}</span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(change.status)}`}
                        >
                          {getStatusIcon(change.status)}
                          <span className="ml-1">{change.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{change.description}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        "{change.prompt}"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(change.timestamp)}
                        </span>
                        <div className="flex space-x-1">
                          {change.status === 'applied' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRevert(change.id);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Revert
                            </Button>
                          )}
                          {change.status === 'reverted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onApply(change.id);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Change Details */}
            <div className="w-1/2 p-4">
              {selectedChange ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Change Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">File:</span> {selectedChange.file}
                      </div>
                      <div>
                        <span className="font-medium">Description:</span> {selectedChange.description}
                      </div>
                      <div>
                        <span className="font-medium">Prompt:</span> "{selectedChange.prompt}"
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {formatTimestamp(selectedChange.timestamp)}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge 
                          variant="secondary" 
                          className={`ml-2 ${getStatusColor(selectedChange.status)}`}
                        >
                          {getStatusIcon(selectedChange.status)}
                          <span className="ml-1">{selectedChange.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Modifications</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(selectedChange.modifications, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Select a change to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 