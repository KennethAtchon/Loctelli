'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Trash2, 
  Bot, 
  User, 
  MessageSquare,
  Loader2,
  UserCheck
} from 'lucide-react';
import { DetailedLead } from '@/lib/api/endpoints/admin-auth';
import { Lead } from '@/types';
import logger from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    leadId?: number;
    leadName?: string;
  };
}

export default function ChatPage() {
  const { currentFilter, getCurrentSubaccount } = useSubaccountFilter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadProfile, setleadProfile] = useState<DetailedLead | null>(null);
  const [isLoadinglead, setIsLoadinglead] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load leads for dropdown
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setIsLoadingLeads(true);
        setError(null);
        
        const currentSubaccount = getCurrentSubaccount();
        const params: { subAccountId?: number } = {};
        
        if (currentSubaccount) {
          params.subAccountId = currentSubaccount.id;
          logger.debug('Loading leads for subaccount:', currentSubaccount.name, currentSubaccount.id);
        } else {
          logger.debug('Loading leads for global view');
        }
        
        const leadsData = await api.leads.getLeads(params);
        setLeads(leadsData);
        logger.debug('Loaded leads:', leadsData.length);
      } catch (error) {
        logger.error('Failed to load leads:', error);
        setError('Failed to load leads list');
      } finally {
        setIsLoadingLeads(false);
      }
    };
    loadLeads();
  }, [currentFilter, getCurrentSubaccount]);

  // Cleanup error state on unmount
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  // Clear selected lead when subaccount filter changes
  useEffect(() => {
    if (selectedLeadId) {
      const currentSubaccount = getCurrentSubaccount();
      const selectedLead = leads.find(lead => lead.id.toString() === selectedLeadId);
      
      // If we have a selected lead but it doesn't belong to the current subaccount, clear it
      if (selectedLead && currentSubaccount && selectedLead.subAccountId !== currentSubaccount.id) {
        logger.debug('Clearing selected lead due to subaccount filter change');
        setSelectedLeadId('');
        setMessages([]);
        setInputMessage('');
        setIsTyping(false);
        setIsLoading(false);
        setIsLoadingHistory(false);
        setError(null);
        setleadProfile(null);
      }
    }
  }, [currentFilter, leads, selectedLeadId, getCurrentSubaccount]);

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
        setError('Please select a valid lead');
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
      logger.error('Failed to load lead profile:', error);
      setError('Lead not found. Please select a different lead.');
      setleadProfile(null);
      setMessages([]);
    } finally {
      setIsLoadinglead(false);
    }
  };

  const loadChatHistory = async (leadIdNum: number, leadName?: string) => {
    try {
      setIsLoadingHistory(true);
      const history = await api.chat.getChatHistory(leadIdNum);
      
      logger.debug('Raw chat history from API:', history);
      
      // Convert backend message format to frontend format
      const convertedMessages: ChatMessage[] = history.map((msg: any, index: number) => {
        // Handle both old format (from/message) and new format (role/content)
        let role: 'user' | 'assistant';
        let content: string;
        
        if (msg.role && msg.content) {
          // New format
          role = msg.role === 'assistant' ? 'assistant' : 'user';
          content = msg.content;
        } else if (msg.from && msg.message) {
          // Old format
          role = msg.from === 'bot' ? 'assistant' : 'user';
          content = msg.message;
        } else {
          // Fallback
          role = 'user';
          content = msg.content || msg.message || '';
        }
        
        logger.debug(`Converting message ${index}:`, { original: msg, converted: { role, content } });
        
        return {
          id: `${leadIdNum}-${index}`,
          role,
          content,
          timestamp: new Date(msg.timestamp || Date.now()),
          metadata: {
            leadId: leadIdNum,
            leadName: leadName
          }
        };
      });
      
      logger.debug('Converted messages:', convertedMessages);
      setMessages(convertedMessages);
    } catch (error) {
      logger.error('Failed to load chat history:', error);
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLeadSelection = (value: string) => {
    // Clear all chat-related state immediately
    setSelectedLeadId(value);
    setMessages([]);
    setInputMessage('');
    setIsTyping(false);
    setIsLoading(false);
    setIsLoadingHistory(false);
    setError(null);
    setleadProfile(null);
    if (value.trim()) {
      loadleadProfile(value);
    }
  };

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !selectedLeadId.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Show typing indicator
      setIsTyping(true);

      // Send message to API with lead ID
      const response = await api.chat.sendMessage({
        leadId: parseInt(selectedLeadId, 10),
        content: userMessage,
        role: 'user'
      });

      logger.debug('Chat API response:', response);

      // Remove typing indicator
      setIsTyping(false);

      // Add both user message and AI response to chat
      // The backend saves both messages to the database, so we add them to local state
      addMessage({
        role: 'user',
        content: userMessage,
        metadata: {
          leadId: parseInt(selectedLeadId, 10),
          leadName: leadProfile?.name
        }
      });

      addMessage({
        role: 'assistant',
        content: (response.aiMessage as any).content || 'No response received',
        metadata: {
          leadId: parseInt(selectedLeadId, 10),
          leadName: leadProfile?.name
        }
      });

    } catch (err) {
      logger.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!selectedLeadId) return;
    if (confirm('Are you sure you want to clear the chat history? This will permanently delete all messages for this lead.')) {
      try {
        await api.chat.clearChatHistory(Number(selectedLeadId));
        setMessages([]);
        setInputMessage('');
        setIsTyping(false);
        setIsLoading(false);
        setIsLoadingHistory(false);
        setError(null);
        toast({
          title: 'Chat history cleared',
          description: 'All messages for this lead have been deleted.',
          variant: 'default',
        });
        // Reload chat history to confirm
        await loadChatHistory(Number(selectedLeadId), leadProfile?.name);
      } catch (err) {
        logger.error('Failed to clear chat history:', err);
        toast({
          title: 'Error',
          description: 'Failed to clear chat history. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'lead':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Disclaimer */}
      <div className="w-full bg-yellow-50 border-b border-yellow-200 py-3 px-4 flex items-center justify-center">
        <div className="flex items-center space-x-3 max-w-3xl">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-yellow-900 font-medium">
            ⚠️ This chat simulator is <span className="font-bold">LIVE</span>. All actions (messages, AI responses, etc.) are saved to the selected lead's real record. <span className="font-bold">Do NOT use real leads for testing unless you intend to update their actual CRM history.</span>
          </span>
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
      <div className="border-b bg-white p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Chat Assistant</h1>
              <p className="text-sm text-gray-500">Test AI responses by spoofing lead ID</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearChat}
              className="border-gray-200 hover:bg-gray-50"
              disabled={!selectedLeadId}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Lead Selection */}
      <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Select Lead</label>
                <p className="text-xs text-gray-500">Choose a lead to impersonate</p>
              </div>
            </div>
            <Select
              value={selectedLeadId}
              onValueChange={handleLeadSelection}
              disabled={isLoadingLeads}
            >
              <SelectTrigger className="w-80 h-14 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={isLoadingLeads ? "Loading leads..." : "Select a lead to spoof..."} />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-700">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-gray-500">
                          {lead.email || 'No email'} • {lead.company || 'No company'}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(isLoadinglead || isLoadingLeads) && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Lead Profile Display */}
        {leadProfile && (
          <div className="max-w-4xl mx-auto mt-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-700">
                      {leadProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{leadProfile.name}</h3>
                    <p className="text-sm text-gray-500">
                      {leadProfile.email} • {leadProfile.company || 'No company'}
                    </p>
                    {leadProfile.phone && (
                      <p className="text-sm text-gray-500">{leadProfile.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={getStatusBadgeVariant(leadProfile.status)}
                    className="px-3 py-1"
                  >
                    {leadProfile.status}
                  </Badge>
                  {leadProfile.strategy && (
                    <Badge 
                      variant="outline"
                      className="px-3 py-1 border-blue-200 text-blue-700"
                    >
                      {leadProfile.strategy.name}
                    </Badge>
                  )}
                </div>
              </div>
              {leadProfile.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 italic">
                    "{leadProfile.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mt-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <p className="text-xs text-red-600 mt-1">Please try selecting a different lead or contact support.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.length === 0 && !isLoading && !isLoadingHistory && (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {leadProfile 
                    ? `You're now chatting as ${leadProfile.name}. Send a message to begin your conversation with the AI assistant.`
                    : 'Select a lead from the dropdown above to start chatting with the AI assistant.'
                  }
                </p>
                {leadProfile && (
                  <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-blue-700">Connected as {leadProfile.name}</span>
                  </div>
                )}
              </div>
            )}

            {isLoadingHistory && (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading conversation</h3>
                <p className="text-sm text-gray-500">Retrieving your chat history...</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-2xl`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-2' 
                      : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`relative max-w-lg lg:max-w-xl ${
                    message.role === 'user' ? 'order-1' : 'order-2'
                  }`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      {/* Message Content */}
                      <div className="prose prose-sm max-w-none">
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          message.role === 'user' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {message.content}
                        </p>
                      </div>

                      {/* Message Footer */}
                      <div className={`flex items-center justify-between mt-2 pt-2 ${
                        message.role === 'user' 
                          ? 'border-t border-blue-400/30' 
                          : 'border-t border-gray-100'
                      }`}>
                        <span className={`text-xs ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.metadata?.leadName && (
                          <Badge 
                            variant={message.role === 'user' ? 'secondary' : 'outline'} 
                            className={`text-xs ${
                              message.role === 'user' 
                                ? 'bg-blue-400/20 text-blue-100 border-blue-400/30' 
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {message.metadata.leadName}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Message Tail - now at the bottom */}
                    <div className={`absolute w-2 h-2 transform rotate-45 ${
                      message.role === 'user'
                        ? 'right-[-4px] bottom-[-6px] bg-blue-500'
                        : 'left-[-4px] bottom-[-6px] bg-white border-l border-b border-gray-200'
                    }`} />
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="flex items-end space-x-2 max-w-2xl">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>

                  {/* Typing Indicator */}
                  <div className="relative max-w-lg lg:max-w-xl">
                    <div className="px-4 py-3 rounded-2xl shadow-sm bg-white border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">AI is typing...</span>
                      </div>
                    </div>
                    
                    {/* Message Tail */}
                    <div className="absolute top-3 left-[-4px] w-2 h-2 transform rotate-45 bg-white border-l border-t border-gray-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={leadProfile ? "Type your message..." : "Select a lead first..."}
                disabled={!leadProfile || isLoading}
                className="min-h-[44px] max-h-32 resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl pr-12"
                rows={1}
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                {inputMessage.length > 0 && `${inputMessage.length} chars`}
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !leadProfile}
              className="h-11 w-11 rounded-full p-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {leadProfile 
                ? "Press Enter to send, Shift+Enter for new line"
                : "Please select a lead to start chatting"
              }
            </span>
            {leadProfile && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Connected as {leadProfile.name}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 