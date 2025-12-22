"use client";

import { useState, useEffect } from "react";
import logger from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AgentInfo {
  identity: {
    name: string;
    role: string;
    title?: string;
    authorityLevel: string;
  };
  tools: Array<{
    name: string;
    description: string;
  }>;
  providers: string[];
  model: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  } | null;
  memory: {
    contextWindow: number;
    longTermEnabled: boolean;
    autoPersist: {
      persistAll?: boolean;
      minImportance?: number;
      types?: string[];
    } | null;
  };
  systemPromptPreview: string;
  systemPromptFull?: string;
  systemPromptLength: number;
  agentId: string;
  status: string;
  metadata?: {
    id: string;
    status: string;
    createdAt?: Date;
    lastUsed?: Date;
  };
}

interface AgentInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: number;
  leadId?: number;
}

export default function AgentInfoModal({
  open,
  onOpenChange,
  userId,
  leadId,
}: AgentInfoModalProps) {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId && leadId) {
      fetchAgentInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, leadId]);

  const fetchAgentInfo = async () => {
    if (!userId || !leadId) {
      setError("User ID and Lead ID are required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = api.buildQueryString({
        userId,
        leadId,
      });
      const data: AgentInfo = await api.get<AgentInfo>(
        `/ai-receptionist/dev/agent-info?${queryParams}`
      );
      setAgentInfo(data);
    } catch (err) {
      logger.error("Failed to fetch agent info:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch agent info"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleFullPrompt = () => {
    setShowFullPrompt(!showFullPrompt);
  };

  const getSystemPromptDisplay = () => {
    if (showFullPrompt && agentInfo?.systemPromptFull) {
      return agentInfo.systemPromptFull;
    }
    return agentInfo?.systemPromptPreview || "";
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agent Information</DialogTitle>
          <DialogDescription>
            Details about the current AI agent configuration
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading agent information...</span>
          </div>
        )}

        {error && (
          <div className="text-red-600 py-4">
            <p>Error: {error}</p>
            <Button onClick={fetchAgentInfo} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        )}

        {agentInfo && !isLoading && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Identity */}
            <Card>
              <CardHeader>
                <CardTitle>Identity</CardTitle>
                <CardDescription>
                  Agent identity and role information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm break-words">
                      {agentInfo.identity.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">Role:</span>
                    <span className="text-sm break-words">
                      {agentInfo.identity.role || "N/A"}
                    </span>
                  </div>
                  {agentInfo.identity.title && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-sm font-medium">Title:</span>
                      <span className="text-sm break-words">
                        {agentInfo.identity.title}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">
                      Authority Level:
                    </span>
                    <Badge variant="secondary" className="w-fit">
                      {agentInfo.identity.authorityLevel || "N/A"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Provider */}
            <Card>
              <CardHeader>
                <CardTitle>Model Provider</CardTitle>
                <CardDescription>AI model configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">Provider:</span>
                    <Badge className="w-fit">
                      {agentInfo.model?.provider || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">Model:</span>
                    <span className="font-mono text-sm break-words">
                      {agentInfo.model?.model || "N/A"}
                    </span>
                  </div>
                  {agentInfo.model?.temperature !== undefined && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-sm font-medium">Temperature:</span>
                      <span className="text-sm">
                        {agentInfo.model.temperature}
                      </span>
                    </div>
                  )}
                  {agentInfo.model?.maxTokens !== undefined && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-sm font-medium">Max Tokens:</span>
                      <span className="text-sm">
                        {agentInfo.model.maxTokens}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Tools</CardTitle>
                <CardDescription>
                  Available tools for the agent ({agentInfo.tools.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {agentInfo.tools.length === 0 ? (
                    <p className="text-sm text-gray-500">No tools available</p>
                  ) : (
                    agentInfo.tools.map((tool) => (
                      <div key={tool.name} className="border rounded p-2">
                        <div className="font-mono text-sm font-semibold">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {tool.description}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Providers */}
            <Card>
              <CardHeader>
                <CardTitle>Providers</CardTitle>
                <CardDescription>Configured service providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agentInfo.providers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No providers configured
                    </p>
                  ) : (
                    agentInfo.providers.map((provider) => (
                      <Badge key={provider} variant="outline">
                        {provider}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Memory Config */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Configuration</CardTitle>
                <CardDescription>
                  Memory settings and persistence rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">Context Window:</span>
                    <span className="text-sm">
                      {agentInfo.memory?.contextWindow || 20} messages
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">
                      Long-term Enabled:
                    </span>
                    <Badge
                      variant={
                        agentInfo.memory?.longTermEnabled
                          ? "default"
                          : "secondary"
                      }
                      className="w-fit"
                    >
                      {agentInfo.memory?.longTermEnabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                {agentInfo.memory?.autoPersist && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium mb-2">
                      Auto-Persist Rules:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agentInfo.memory.autoPersist.persistAll && (
                        <Badge variant="default">Persist All</Badge>
                      )}
                      {agentInfo.memory.autoPersist.minImportance !==
                        undefined && (
                        <Badge variant="outline">
                          Min Importance:{" "}
                          {agentInfo.memory.autoPersist.minImportance}
                        </Badge>
                      )}
                    </div>
                    {agentInfo.memory.autoPersist.types &&
                      agentInfo.memory.autoPersist.types.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600 mb-1">
                            Types:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {agentInfo.memory.autoPersist.types.map((type) => (
                              <Badge
                                key={type}
                                variant="outline"
                                className="text-xs"
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {!agentInfo.memory?.autoPersist &&
                  agentInfo.memory?.longTermEnabled && (
                    <div className="text-sm text-gray-500 mt-2">
                      Auto-persist configuration not available
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* System Prompt */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Prompt</CardTitle>
                    <CardDescription>
                      {agentInfo.systemPromptLength.toLocaleString()} characters
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(getSystemPromptDisplay(), "System Prompt")
                    }
                  >
                    {copiedField === "System Prompt" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="text-xs font-mono bg-gray-50 p-4 rounded border overflow-x-auto max-h-96 overflow-y-auto break-words whitespace-pre-wrap">
                    {getSystemPromptDisplay()}
                  </pre>
                  {agentInfo.systemPromptLength > 500 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullPrompt}
                      className="mt-2"
                    >
                      {showFullPrompt ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show Full Prompt (
                          {agentInfo.systemPromptLength.toLocaleString()} chars)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Agent Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Metadata</CardTitle>
                <CardDescription>Agent instance information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">Agent ID:</span>
                    <span className="font-mono text-xs break-all">
                      {agentInfo.agentId || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="secondary" className="w-fit">
                      {agentInfo.status || "N/A"}
                    </Badge>
                  </div>
                  {agentInfo.metadata?.createdAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-sm font-medium">Created At:</span>
                      <span className="text-sm">
                        {new Date(
                          agentInfo.metadata.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {agentInfo.metadata?.lastUsed && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-sm font-medium">Last Used:</span>
                      <span className="text-sm">
                        {new Date(agentInfo.metadata.lastUsed).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
