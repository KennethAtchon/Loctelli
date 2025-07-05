'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Trash2, 
  Bot, 
  User, 
  MessageSquare,
  Loader2,
  UserCheck
} from 'lucide-react';
import { DetailedClient } from '@/lib/api/endpoints/admin-auth';
import logger from '@/lib/logger';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    clientId?: number;
    clientName?: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientProfile, setClientProfile] = useState<DetailedClient | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadClientProfile = async (id: string) => {
    if (!id.trim()) {
      setClientProfile(null);
      return;
    }

    try {
      setIsLoadingClient(true);
      setError(null);
      const clientIdNum = parseInt(id, 10);
      
      if (isNaN(clientIdNum)) {
        setError('Please enter a valid client ID (number)');
        setClientProfile(null);
        return;
      }

      const client = await api.adminAuth.getDetailedClient(clientIdNum);
      setClientProfile(client);
      setError(null);
    } catch (error) {
      logger.error('Failed to load client profile:', error);
      setError('Client not found. Please check the client ID.');
      setClientProfile(null);
    } finally {
      setIsLoadingClient(false);
    }
  };

  const handleClientIdChange = (value: string) => {
    setClientId(value);
    if (value.trim()) {
      loadClientProfile(value);
    } else {
      setClientProfile(null);
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
    if (!inputMessage.trim() || isLoading || !clientId.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    // Add user message to chat
    addMessage({
      role: 'user',
      content: userMessage
    });

    try {
      // Show typing indicator
      setIsTyping(true);

      // Send message to API with client ID
      const response = await api.chat.sendMessage({
        clientId: parseInt(clientId, 10),
        content: userMessage,
        role: 'user'
      });

      // Remove typing indicator
      setIsTyping(false);

      // Add assistant response to chat
      addMessage({
        role: 'assistant',
        content: response.aiMessage.content,
        metadata: {
          clientId: parseInt(clientId, 10),
          clientName: clientProfile?.name
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
    if (confirm('Are you sure you want to clear the chat history?')) {
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
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Chat Assistant</h1>
              <p className="text-sm text-gray-500">Test AI responses by spoofing client ID</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Client ID Input */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Client ID:</label>
          </div>
          <Input
            type="number"
            placeholder="Enter client ID to spoof..."
            value={clientId}
            onChange={(e) => handleClientIdChange(e.target.value)}
            className="w-48"
          />
          {isLoadingClient && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
        </div>
        
        {/* Client Profile Display */}
        {clientProfile && (
          <div className="mt-3 p-3 bg-white border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{clientProfile.name}</h3>
                <p className="text-sm text-gray-500">
                  {clientProfile.email} • {clientProfile.company || 'No company'}
                </p>
                {clientProfile.phone && (
                  <p className="text-sm text-gray-500">{clientProfile.phone}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusBadgeVariant(clientProfile.status)}>
                  {clientProfile.status}
                </Badge>
                {clientProfile.strategy && (
                  <Badge variant="outline">
                    {clientProfile.strategy.name}
                  </Badge>
                )}
              </div>
            </div>
            {clientProfile.notes && (
              <p className="text-sm text-gray-600 mt-2 italic">
                "{clientProfile.notes}"
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
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Bot className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Start a conversation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {clientProfile 
                    ? `Chatting as: ${clientProfile.name}`
                    : 'Enter a client ID to start chatting'
                  }
                </p>
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
                        {message.metadata?.clientName && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.clientName}
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
            placeholder={clientProfile ? "Type your message..." : "Enter a client ID first..."}
            disabled={!clientProfile || isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !clientProfile}
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
          {clientProfile 
            ? "Press Enter to send, Shift+Enter for new line"
            : "Please enter a valid client ID to start chatting"
          }
        </div>
      </div>
    </div>
  );
} 