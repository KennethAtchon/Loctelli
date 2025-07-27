'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  showSmsCount?: boolean;
  showTemplates?: boolean;
  templates?: MessageTemplate[];
  onTemplateSelect?: (template: MessageTemplate) => void;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    content: 'Welcome to our service! We\'re excited to have you on board. Reply STOP to opt out.',
    category: 'Welcome',
  },
  {
    id: 'reminder',
    name: 'Appointment Reminder',
    content: 'Hi! This is a reminder about your appointment tomorrow at [TIME]. Please confirm by replying YES.',
    category: 'Reminders',
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    content: 'Thanks for your interest! I wanted to follow up on our conversation. Do you have any questions?',
    category: 'Follow Up',
  },
  {
    id: 'promotion',
    name: 'Special Offer',
    content: 'Special offer just for you! Get 20% off your next purchase. Use code SAVE20. Valid until [DATE].',
    category: 'Promotions',
  },
];

export function MessageComposer({
  value,
  onChange,
  placeholder = "Type your message here...",
  disabled = false,
  required = false,
  className,
  label = "Message",
  maxLength = 1600,
  showCharacterCount = true,
  showSmsCount = true,
  showTemplates = true,
  templates = DEFAULT_TEMPLATES,
  onTemplateSelect,
}: MessageComposerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Calculate SMS segments (160 chars per SMS for GSM, 70 for Unicode)
  const calculateSmsSegments = (text: string): { segments: number; encoding: 'GSM' | 'Unicode' } => {
    // Check if text contains Unicode characters
    const hasUnicode = /[^\x00-\x7F]/.test(text);
    const encoding = hasUnicode ? 'Unicode' : 'GSM';
    const maxCharsPerSegment = hasUnicode ? 70 : 160;
    
    if (text.length === 0) return { segments: 0, encoding };
    
    const segments = Math.ceil(text.length / maxCharsPerSegment);
    return { segments, encoding };
  };

  const { segments, encoding } = calculateSmsSegments(value);
  const remainingChars = maxLength - value.length;

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template.id);
    onChange(template.content);
    onTemplateSelect?.(template);
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    onChange('');
  };

  const getCharacterCountColor = () => {
    if (remainingChars < 0) return 'text-red-500';
    if (remainingChars < 50) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  const getSmsCountColor = () => {
    if (segments > 3) return 'text-orange-500';
    if (segments > 5) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <Label htmlFor="message-composer">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Message Templates */}
      {showTemplates && templates.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Message Templates</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  disabled={disabled}
                  className="justify-start h-auto p-3 text-left"
                >
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.content.substring(0, 60)}...
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            {selectedTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTemplate}
                className="mt-2"
              >
                Clear Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Message Input */}
      <div className="relative">
        <Textarea
          id="message-composer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          rows={6}
          className={cn(
            "resize-none",
            remainingChars < 0 && "border-red-500 focus:border-red-500"
          )}
        />
        
        {/* Character and SMS count overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs">
          {showCharacterCount && (
            <Badge variant="secondary" className={getCharacterCountColor()}>
              {value.length}/{maxLength}
            </Badge>
          )}
          
          {showSmsCount && value.length > 0 && (
            <Badge variant="outline" className={getSmsCountColor()}>
              {segments} SMS ({encoding})
            </Badge>
          )}
        </div>
      </div>

      {/* Message Info */}
      <div className="space-y-2">
        {/* Character limit warning */}
        {remainingChars < 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Message exceeds maximum length by {Math.abs(remainingChars)} characters</span>
          </div>
        )}

        {/* SMS segment info */}
        {showSmsCount && segments > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>
              This message will be sent as {segments} SMS segments
              {segments > 3 && " (consider shortening for better delivery rates)"}
            </span>
          </div>
        )}

        {/* Encoding info */}
        {encoding === 'Unicode' && (
          <div className="text-xs text-muted-foreground">
            Unicode characters detected - 70 characters per SMS segment
          </div>
        )}

        {/* Best practices */}
        {value.length === 0 && (
          <div className="text-xs text-muted-foreground">
            💡 Tip: Keep messages concise and include a clear call-to-action. 
            Always include opt-out instructions for marketing messages.
          </div>
        )}
      </div>
    </div>
  );
}