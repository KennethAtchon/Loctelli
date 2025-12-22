"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Bot, MessageSquare, Loader2, UserCheck } from "lucide-react";
import { DetailedLead } from "@/lib/api/endpoints/admin-auth";
import { Lead } from "@/types";
import logger from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/tenant-context";
import ChatInterface, {
  type Message as ChatInterfaceMessage,
  type ChatInterfaceConfig,
  type ChatInterfaceRef,
} from "@/components/chat/chat-interface";
import AgentInfoModal from "@/components/admin/agent-info-modal";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  metadata?: {
    leadId?: number;
    leadName?: string;
    imageBase64?: string;
  };
}

interface ApiChatMessage {
  role?: "user" | "assistant";
  content?: string;
  from?: "bot" | "user";
  message?: string;
  timestamp?: string;
}

interface ChatApiResponse {
  aiMessage: {
    content: string;
    role: "assistant";
  };
}

export default function ChatPage() {
  const { getTenantQueryParams } = useTenant();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInterfaceMessages, setChatInterfaceMessages] = useState<
    ChatInterfaceMessage[]
  >([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadProfile, setleadProfile] = useState<DetailedLead | null>(null);
  const [isLoadinglead, setIsLoadinglead] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);
  const [isAgentInfoModalOpen, setIsAgentInfoModalOpen] = useState(false);

  const { toast } = useToast();

  // Convert ChatMessage to ChatInterfaceMessage
  const convertToInterfaceMessage = (
    message: ChatMessage
  ): ChatInterfaceMessage => {
    let content = message.content;
    // If message has an image, include it in the content
    if (message.imageUrl) {
      content = `${content}\n![Image](${message.imageUrl})`;
    }
    return {
      id: message.id,
      content: content,
      type: message.role === "user" ? "user" : "system",
      completed: true,
    };
  };

  // Update ChatInterface messages when messages change
  useEffect(() => {
    const interfaceMessages = messages.map(convertToInterfaceMessage);
    setChatInterfaceMessages(interfaceMessages);
  }, [messages]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  // Load leads for dropdown
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setIsLoadingLeads(true);
        setError(null);

        // Use tenant context for automatic filtering
        const queryParams = getTenantQueryParams();
        logger.debug("Loading leads with tenant params:", queryParams);

        const leadsData = await api.leads.getLeads(queryParams);
        setLeads(leadsData);
        logger.debug("Loaded leads:", leadsData.length);
      } catch (error) {
        logger.error("Failed to load leads:", error);
        setError("Failed to load leads list");
      } finally {
        setIsLoadingLeads(false);
      }
    };
    loadLeads();
  }, [getTenantQueryParams]);

  // Cleanup error state on unmount
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  // Clear selected lead when subaccount filter changes
  useEffect(() => {
    if (selectedLeadId) {
      const { subAccountId } = getTenantQueryParams();
      const selectedLead = leads.find(
        (lead) => lead.id.toString() === selectedLeadId
      );

      // If we have a selected lead but it doesn't belong to the current subaccount, clear it
      if (
        selectedLead &&
        subAccountId &&
        selectedLead.subAccountId !== subAccountId
      ) {
        logger.debug("Clearing selected lead due to tenant filter change");
        setSelectedLeadId("");
        setMessages([]);
        setIsTyping(false);
        setIsLoading(false);
        setIsLoadingHistory(false);
        setError(null);
        setleadProfile(null);
      }
    }
  }, [getTenantQueryParams, leads, selectedLeadId]);

  const loadleadProfile = async (id: string) => {
    if (!id.trim()) {
      setleadProfile(null);
      setMessages([]);
      return;
    }

    try {
      setIsLoadinglead(true);
      setError(null);
      const leadIdNum = parseInt(id, 10);

      if (isNaN(leadIdNum)) {
        setError("Please select a valid lead");
        setleadProfile(null);
        setMessages([]);
        return;
      }

      const lead = await api.adminAuth.getDetailedLead(leadIdNum);
      setleadProfile(lead);
      setError(null);

      // Load chat history for this lead
      await loadChatHistory(leadIdNum, lead.name);
    } catch (error) {
      logger.error("Failed to load lead profile:", error);
      setError("Lead not found. Please select a different lead.");
      setleadProfile(null);
      setMessages([]);
    } finally {
      setIsLoadinglead(false);
    }
  };

  const loadChatHistory = async (leadIdNum: number, leadName?: string) => {
    try {
      setIsLoadingHistory(true);
      const history: unknown[] = await api.chat.getChatHistory(leadIdNum);

      logger.debug("Raw chat history from API:", history);

      // If no messages exist, automatically initiate the conversation
      if (!history || history.length === 0) {
        logger.debug("No messages found, initiating AI conversation...");
        try {
          const initiateResult = await api.chat.initiateConversation(leadIdNum);
          logger.debug("AI conversation initiated:", initiateResult);

          // Reload chat history to get the AI's initial message
          const updatedHistory: unknown[] =
            await api.chat.getChatHistory(leadIdNum);
          history.length = 0;
          history.push(...updatedHistory);

          toast({
            title: "Conversation Started",
            description: "AI has sent the first message!",
          });
        } catch (initiateError) {
          logger.error("Failed to initiate conversation:", initiateError);
          // Continue with empty history if initiation fails
        }
      }

      // Convert backend message format to frontend format
      const convertedMessages: ChatMessage[] = history.map(
        (msg: unknown, index: number) => {
          const message = msg as ApiChatMessage;
          // Handle both old format (from/message) and new format (role/content)
          let role: "user" | "assistant";
          let content: string;

          if (message.role && message.content) {
            // New format
            role = message.role === "assistant" ? "assistant" : "user";
            content = message.content;
          } else if (message.from && message.message) {
            // Old format
            role = message.from === "bot" ? "assistant" : "user";
            content = message.message;
          } else {
            // Fallback
            role = "user";
            content = message.content || message.message || "";
          }

          logger.debug(`Converting message ${index}:`, {
            original: message,
            converted: { role, content },
          });

          return {
            id: `${leadIdNum}-${index}`,
            role,
            content,
            timestamp: new Date(message.timestamp || Date.now()),
            metadata: {
              leadId: leadIdNum,
              leadName: leadName,
            },
          };
        }
      );

      logger.debug("Converted messages:", convertedMessages);
      setMessages(convertedMessages);
    } catch (error) {
      logger.error("Failed to load chat history:", error);
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLeadSelection = (value: string) => {
    // Clear all chat-related state immediately
    setSelectedLeadId(value);
    setMessages([]);
    setIsTyping(false);
    setIsLoading(false);
    setIsLoadingHistory(false);
    setError(null);
    setleadProfile(null);
    if (value.trim()) {
      loadleadProfile(value);
    }
  };

  const clearChat = async () => {
    if (!selectedLeadId) return;
    if (
      confirm(
        "Are you sure you want to clear the chat history? This will permanently delete all messages for this lead."
      )
    ) {
      try {
        await api.chat.clearChatHistory(Number(selectedLeadId));
        setMessages([]);
        setIsTyping(false);
        setIsLoading(false);
        setIsLoadingHistory(false);
        setError(null);
        toast({
          title: "Chat history cleared",
          description: "All messages for this lead have been deleted.",
          variant: "default",
        });
        // Reload chat history to confirm
        await loadChatHistory(Number(selectedLeadId), leadProfile?.name);
      } catch (err) {
        logger.error("Failed to clear chat history:", err);
        toast({
          title: "Error",
          description: "Failed to clear chat history. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle message sending from ChatInterface
  const handleChatInterfaceSendMessage = async (
    message: string,
    images?: File[]
  ) => {
    if (!selectedLeadId.trim()) {
      setError("Please select a lead first");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Convert images to base64 if present
    let imageBase64Array: string[] = [];
    let imageMetadata: {
      images: Array<{ base64: string; name: string; type: string }>;
      hasImages: boolean;
      imageCount: number;
    } = {
      images: [],
      hasImages: false,
      imageCount: 0,
    };

    if (images && images.length > 0) {
      const imagePromises = images.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        imageBase64Array = await Promise.all(imagePromises);
        imageMetadata = {
          images: imageBase64Array.map((base64, index) => ({
            base64,
            name: images[index].name,
            type: images[index].type,
          })),
          hasImages: true,
          imageCount: images.length,
        };
      } catch (err) {
        logger.error("Failed to read images:", err);
        setError("Failed to process images. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    // Build message content
    const messageContent =
      message ||
      (images && images.length > 0
        ? `[Sent ${images.length} image${images.length > 1 ? "s" : ""}]`
        : "");

    // First, add the user message immediately
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageContent,
      imageUrl: imageBase64Array.length > 0 ? imageBase64Array[0] : undefined,
      timestamp: new Date(),
      metadata: {
        leadId: parseInt(selectedLeadId, 10),
        leadName: leadProfile?.name,
        ...imageMetadata,
      },
    };

    // Add user message to the chat immediately
    setMessages((prev) => [...prev, userMessage]);

    // Start typing indicator for API call (not streaming yet)
    setIsTyping(true);

    try {
      // Send message to API with lead ID and images
      const response = (await api.chat.sendMessage({
        leadId: parseInt(selectedLeadId, 10),
        content: messageContent,
        role: "user",
        metadata: {
          ...imageMetadata,
          leadId: parseInt(selectedLeadId, 10),
          leadName: leadProfile?.name,
        },
      })) as ChatApiResponse;

      logger.debug("Chat API response:", response);

      // Create AI message with empty content first
      const aiMessageId = `${Date.now()}-ai`;
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "", // Start with empty content
        timestamp: new Date(),
        metadata: {
          leadId: parseInt(selectedLeadId, 10),
          leadName: leadProfile?.name,
        },
      };

      // Add AI message placeholder to chat
      setMessages((prev) => [...prev, aiMessage]);

      // Stop the typing indicator and start streaming the AI response
      setIsTyping(false);
      const aiContent = response.aiMessage?.content || "No response received";
      if (chatInterfaceRef.current) {
        await chatInterfaceRef.current.startStreamingMessage(
          aiMessageId,
          aiContent
        );
      }
    } catch (err) {
      logger.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle streaming message completion
  const handleStreamingMessageComplete = (
    messageId: string,
    content: string
  ) => {
    // Update the message with the complete content and mark as completed
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content, completed: true } : msg
      )
    );
  };

  // ChatInterface configuration
  const chatInterfaceConfig: ChatInterfaceConfig = {
    showHeader: false,
    placeholder: leadProfile
      ? "Type your message..."
      : "Select a lead first...",
    disabledPlaceholder: "Waiting for response...",
    showActionButtons: true,
    showMessageActions: true,
    autoFocus: !isMobile,
    enableKeyboardShortcuts: true,
    maxHeight: "calc(100vh - 400px)",
    variant: "default",
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default";
      case "lead":
        return "secondary";
      case "inactive":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex flex-col">
      {/* Disclaimer Banner */}
      <div className="w-full py-4 px-4 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-4xl w-full">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-yellow-100 rounded-lg">
              <svg
                className="w-4 h-4 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm text-yellow-900 font-medium">
              ⚠️ This chat simulator is <span className="font-bold">LIVE</span>.
              All actions (messages, AI responses, etc.) are saved to the
              selected lead's real record.{" "}
              <span className="font-bold">
                Do NOT use real leads for testing unless you intend to update
                their actual CRM history.
              </span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  AI Chat Assistant
                </h1>
                <p className="text-gray-600 text-base">
                  Test AI responses by spoofing lead conversations in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                disabled={!selectedLeadId}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Selection */}
      <div>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <label className="text-base font-semibold text-gray-800">
                    Select Lead
                  </label>
                  <p className="text-sm text-gray-600">
                    Choose a lead to impersonate for AI chat testing
                  </p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <Select
                  value={selectedLeadId}
                  onValueChange={handleLeadSelection}
                  disabled={isLoadingLeads}
                >
                  <SelectTrigger className="flex-1 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <SelectValue
                      placeholder={
                        isLoadingLeads
                          ? "Loading leads..."
                          : "Select a lead to start chatting..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        <div className="flex items-center space-x-3 py-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {lead.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lead.email || "No email"} •{" "}
                              {lead.company || "No company"}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(isLoadinglead || isLoadingLeads) && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lead Profile Display */}
        {leadProfile && (
          <div className="max-w-7xl mx-auto mt-3 px-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between flex-wrap">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {leadProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {leadProfile.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">{leadProfile.email}</span>
                      <span className="text-gray-400">•</span>
                      <span>{leadProfile.company || "No company"}</span>
                    </div>
                    {leadProfile.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span>📞</span>
                        {leadProfile.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={getStatusBadgeVariant(leadProfile.status)}
                    className="px-3 py-1 text-sm font-medium"
                  >
                    {leadProfile.status}
                  </Badge>
                  {leadProfile.strategy && (
                    <Badge
                      variant="outline"
                      className="px-3 py-1 border-blue-200 text-blue-700 bg-blue-50 text-sm font-medium"
                    >
                      {leadProfile.strategy.name}
                    </Badge>
                  )}
                </div>
              </div>
              {leadProfile.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 italic">
                      "{leadProfile.notes}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-7xl mx-auto mt-3 px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-red-800">
                    {error}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Please try selecting a different lead or contact support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 ">
        <div className="max-w-7xl mx-auto">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Loading conversation
                </h3>
                <p className="text-base text-gray-600">
                  Retrieving your chat history...
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-200px)]">
              {!leadProfile && !isLoading && !isLoadingHistory && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto">
                      Select a lead from the dropdown above to start chatting
                      with the AI assistant.
                    </p>
                  </div>
                </div>
              )}
              {leadProfile && (
                <>
                  <ChatInterface
                    ref={chatInterfaceRef}
                    messages={chatInterfaceMessages}
                    onSendMessage={handleChatInterfaceSendMessage}
                    onStreamingMessage={handleStreamingMessageComplete}
                    isStreaming={isTyping}
                    config={chatInterfaceConfig}
                    disabled={!leadProfile}
                    loading={isLoading}
                    className="h-full"
                    onAgentInfoClick={() => setIsAgentInfoModalOpen(true)}
                  />
                  <AgentInfoModal
                    open={isAgentInfoModalOpen}
                    onOpenChange={setIsAgentInfoModalOpen}
                    userId={leadProfile.regularUserId}
                    leadId={parseInt(selectedLeadId, 10)}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
