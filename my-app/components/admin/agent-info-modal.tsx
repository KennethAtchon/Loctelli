'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  systemPromptLength: number;
  agentId: string;
  status: string;
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
  leadId
}: AgentInfoModalProps) {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [fullPrompt, setFullPrompt] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId && leadId) {
      fetchAgentInfo();
    }
  }, [open, userId, leadId]);

  const fetchAgentInfo = async () => {
    if (!userId || !leadId) {
      setError('User ID and Lead ID are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/proxy/ai-receptionist/dev/agent-info?userId=${userId}&leadId=${leadId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch agent info: ${response.statusText}`);
      }

      const data: AgentInfo = await response.json();
      setAgentInfo(data);
    } catch (err) {
      logger.error('Failed to fetch agent info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agent info');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFullPrompt = async () => {
    if (!userId || !leadId || fullPrompt) return;

    try {
      const response = await fetch(
        `/api/proxy/ai-receptionist/dev/agent-info?userId=${userId}&leadId=${leadId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Get full prompt from the agent
        // For now, we'll use the preview and indicate it's truncated
        setFullPrompt(data.systemPromptPreview);
      }
    } catch (err) {
      logger.error('Failed to fetch full prompt:', err);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: 'Copied',
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleFullPrompt = () => {
    if (!showFullPrompt && !fullPrompt) {
      fetchFullPrompt();
    }
    setShowFullPrompt(!showFullPrompt);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <div className="space-y-4">
            {/* Identity */}
            <Card>
              <CardHeader>
                <CardTitle>Identity</CardTitle>
                <CardDescription>Agent identity and role information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Name:</span>
                  <span>{agentInfo.identity.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role:</span>
                  <span>{agentInfo.identity.role}</span>
                </div>
                {agentInfo.identity.title && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Title:</span>
                    <span>{agentInfo.identity.title}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authority Level:</span>
                  <Badge variant="secondary">{agentInfo.identity.authorityLevel}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Model Provider */}
            {agentInfo.model && (
              <Card>
                <CardHeader>
                  <CardTitle>Model Provider</CardTitle>
                  <CardDescription>AI model configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Provider:</span>
                    <Badge>{agentInfo.model.provider}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Model:</span>
                    <span className="font-mono text-sm">{agentInfo.model.model}</span>
                  </div>
                  {agentInfo.model.temperature !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Temperature:</span>
                      <span>{agentInfo.model.temperature}</span>
                    </div>
                  )}
                  {agentInfo.model.maxTokens !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Max Tokens:</span>
                      <span>{agentInfo.model.maxTokens}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                        <div className="font-mono text-sm font-semibold">{tool.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{tool.description}</div>
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
                    <p className="text-sm text-gray-500">No providers configured</p>
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
                <CardDescription>Memory settings and persistence rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Context Window:</span>
                  <span>{agentInfo.memory.contextWindow} messages</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Long-term Enabled:</span>
                  <Badge variant={agentInfo.memory.longTermEnabled ? 'default' : 'secondary'}>
                    {agentInfo.memory.longTermEnabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {agentInfo.memory.autoPersist && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium mb-2">Auto-Persist Rules:</div>
                    {agentInfo.memory.autoPersist.persistAll && (
                      <Badge variant="default" className="mr-2">
                        Persist All
                      </Badge>
                    )}
                    {agentInfo.memory.autoPersist.minImportance && (
                      <Badge variant="outline" className="mr-2">
                        Min Importance: {agentInfo.memory.autoPersist.minImportance}
                      </Badge>
                    )}
                    {agentInfo.memory.autoPersist.types && agentInfo.memory.autoPersist.types.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Types:</div>
                        <div className="flex flex-wrap gap-1">
                          {agentInfo.memory.autoPersist.types.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                    onClick={() => copyToClipboard(
                      showFullPrompt && fullPrompt ? fullPrompt : agentInfo.systemPromptPreview,
                      'System Prompt'
                    )}
                  >
                    {copiedField === 'System Prompt' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="text-xs font-mono bg-gray-50 p-4 rounded border overflow-x-auto max-h-96 overflow-y-auto">
                    {showFullPrompt && fullPrompt
                      ? fullPrompt
                      : agentInfo.systemPromptPreview}
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
                          Show Full Prompt
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
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Agent ID:</span>
                  <span className="font-mono text-xs">{agentInfo.agentId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="secondary">{agentInfo.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

