"use client";

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
import ChatInterface, {
  type ChatInterfaceConfig,
} from "@/components/chat/chat-interface";
import AgentInfoModal from "@/components/admin/agent-info-modal";
import { useChatState } from "./hooks/useChatState";
import { getStatusBadgeVariant } from "./hooks/useChatHelpers";

export default function ChatPage() {
  const {
    chatInterfaceMessages,
    selectedLeadId,
    isLoading,
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
    handleLeadSelection,
    clearChat,
    handleChatInterfaceSendMessage,
  } = useChatState();

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

  return (
    <div className="flex flex-col">
      {/* Disclaimer Banner */}
      <div className="w-full py-4 px-4 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-4xl w-full dark:bg-amber-950/40 dark:border-amber-800/60">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-yellow-100 rounded-lg dark:bg-amber-900/50">
              <svg
                className="w-4 h-4 text-yellow-600 dark:text-amber-400"
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
            <span className="text-sm text-yellow-900 font-medium dark:text-amber-200">
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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  AI Chat Assistant
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Test AI responses by spoofing lead conversations in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:border-red-800 dark:hover:text-red-200 transition-all duration-200"
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
          <div className="bg-white rounded-xl p-4 border border-gray-200 dark:bg-slate-800/80 dark:border-slate-600/60">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <label className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    Select Lead
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
                  <SelectTrigger className="flex-1 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700/80 dark:border-slate-600 dark:text-gray-100 dark:placeholder:text-gray-400">
                    <SelectValue
                      placeholder={
                        isLoadingLeads
                          ? "Loading leads..."
                          : "Select a lead to start chatting..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100">
                    {leads.map((lead) => (
                      <SelectItem
                        key={lead.id}
                        value={lead.id.toString()}
                        className="dark:focus:bg-slate-700 dark:data-[highlighted]:bg-slate-700"
                      >
                        <div className="flex items-center space-x-3 py-1">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {lead.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
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
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
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
            <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-slate-800/80 dark:border-slate-600/60">
              <div className="flex items-start justify-between flex-wrap">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {leadProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                      {leadProfile.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{leadProfile.email}</span>
                      <span className="text-gray-400 dark:text-gray-500">
                        •
                      </span>
                      <span>{leadProfile.company || "No company"}</span>
                    </div>
                    {leadProfile.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
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
                      className="px-3 py-1 border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-200 dark:bg-blue-900/30 text-sm font-medium"
                    >
                      {leadProfile.strategy.name}
                    </Badge>
                  )}
                </div>
              </div>
              {leadProfile.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-600">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 dark:bg-red-950/40 dark:border-red-900/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
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
                  <p className="text-base font-semibold text-red-800 dark:text-red-200">
                    {error}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
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
                <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Loading conversation
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
