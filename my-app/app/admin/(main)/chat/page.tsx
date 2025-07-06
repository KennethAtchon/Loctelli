'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const inputRef = useRef<HTMLInputElement>(null);

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
        const leadsData = await api.leads.getLeads();
        setLeads(leadsData);
      } catch (error) {
        logger.error('Failed to load leads:', error);
        setError('Failed to load leads list');
      } finally {
        setIsLoadingLeads(false);
      }
    };
    loadLeads();
  }, []);

  // Cleanup error state on unmount
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

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
      await loadChatHistory(leadIdNum);
    } catch (error) {
      logger.error('Failed to load lead profile:', error);
      setError('Lead not found. Please select a different lead.');
      setleadProfile(null);
      setMessages([]);
    } finally {
      setIsLoadinglead(false);
    }
  };

  const loadChatHistory = async (leadIdNum: number) => {
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
            leadName: leadProfile?.name
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
    setSelectedLeadId(value);
    if (value.trim()) {
      loadleadProfile(value);
    } else {
      setleadProfile(null);
      setMessages([]);
      setError(null);
    }
  };

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
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

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history? This will only clear the current view, not the database.')) {
      setMessages([]);
      setError(null);
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
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Chat Assistant</h1>
              <p className="text-sm text-gray-500">Test AI responses by spoofing lead ID</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lead ID Input */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Select Lead:</label>
          </div>
          <Select
            value={selectedLeadId}
            onValueChange={handleLeadSelection}
            disabled={isLoadingLeads}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder={isLoadingLeads ? "Loading leads..." : "Select a lead to spoof..."} />
            </SelectTrigger>
            <SelectContent>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id.toString()}>
                  {lead.name} ({lead.email || 'No email'}) - {lead.company || 'No company'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(isLoadinglead || isLoadingLeads) && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
        </div>
        
        {/* Lead Profile Display */}
        {leadProfile && (
          <div className="mt-3 p-3 bg-white border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{leadProfile.name}</h3>
                <p className="text-sm text-gray-500">
                  {leadProfile.email} • {leadProfile.company || 'No company'}
                </p>
                {leadProfile.phone && (
                  <p className="text-sm text-gray-500">{leadProfile.phone}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusBadgeVariant(leadProfile.status)}>
                  {leadProfile.status}
                </Badge>
                {leadProfile.strategy && (
                  <Badge variant="outline">
                    {leadProfile.strategy.name}
                  </Badge>
                )}
              </div>
            </div>
            {leadProfile.notes && (
              <p className="text-sm text-gray-600 mt-2 italic">
                "{leadProfile.notes}"
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.length === 0 && !isLoading && !isLoadingHistory && (
              <div className="text-center py-12">
                <Bot className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Start a conversation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {leadProfile 
                    ? `Chatting as: ${leadProfile.name}`
                    : 'Select a lead from the dropdown to start chatting'
                  }
                </p>
              </div>
            )}

            {isLoadingHistory && (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Loading chat history...</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.metadata?.leadName && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.leadName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
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
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={leadProfile ? "Type your message..." : "Select a lead first..."}
            disabled={!leadProfile || isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !leadProfile}
            className="px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {leadProfile 
            ? "Press Enter to send, Shift+Enter for new line"
            : "Please select a lead to start chatting"
          }
        </div>
      </div>
    </div>
  );
} 