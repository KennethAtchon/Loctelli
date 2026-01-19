import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import type { Lead } from "@/types";
import type { DetailedLead } from "@/lib/api/endpoints/admin-auth";
import type {
  Message as ChatInterfaceMessage,
  ChatInterfaceRef,
} from "@/components/chat/chat-interface";

export interface ChatMessage {
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

export function useChatState() {
  const { getTenantQueryParams } = useTenant();
  const { toast } = useToast();

  // State
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
  const [isAgentInfoModalOpen, setIsAgentInfoModalOpen] = useState(false);

  // Refs
  const isLoadingLeadsRef = useRef(false);
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);

  // Convert ChatMessage to ChatInterfaceMessage
  const convertToInterfaceMessage = (
    message: ChatMessage
  ): ChatInterfaceMessage => {
    let content = message.content;
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
      if (isLoadingLeadsRef.current) {
        logger.debug("⏸️ loadLeads already in progress, skipping");
        return;
      }

      try {
        isLoadingLeadsRef.current = true;
        setIsLoadingLeads(true);
        setError(null);

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
        }
      }

      // Convert backend message format to frontend format
      const convertedMessages: ChatMessage[] = history.map(
        (msg: unknown, index: number) => {
          const message = msg as ApiChatMessage;
          let role: "user" | "assistant";
          let content: string;

          if (message.role && message.content) {
            role = message.role === "assistant" ? "assistant" : "user";
            content = message.content;
          } else if (message.from && message.message) {
            role = message.from === "bot" ? "assistant" : "user";
            content = message.message;
          } else {
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

  const handleLeadSelection = (value: string) => {
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

    const messageContent =
      message ||
      (images && images.length > 0
        ? `[Sent ${images.length} image${images.length > 1 ? "s" : ""}]`
        : "");

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

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
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

      setIsTyping(false);

      const aiMessage: ChatMessage = {
        id: `${Date.now()}-ai`,
        role: "assistant",
        content: response.aiMessage.content,
        timestamp: new Date(),
        metadata: {
          leadId: parseInt(selectedLeadId, 10),
          leadName: leadProfile?.name,
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      logger.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    messages,
    chatInterfaceMessages,
    selectedLeadId,
    isLoading,
    isTyping,
    error,
    leadProfile,
    isLoadinglead,
    isLoadingHistory,
    leads,
    isLoadingLeads,
    isMobile,
    isAgentInfoModalOpen,
    setIsAgentInfoModalOpen,
    chatInterfaceRef,
    // Actions
    handleLeadSelection,
    clearChat,
    handleChatInterfaceSendMessage,
  };
}
