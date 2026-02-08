"use client";

import { useState, useCallback } from "react";
import { Sparkles, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { CardFormTemplateJson } from "@/lib/forms/card-form-template-json";
import { extractCardFormJsonFromText } from "@/lib/forms/extract-card-form-json";
import { generateStableId } from "@/lib/utils/stable-id";
import { cn } from "@/lib/utils";

export interface CardFormAIBuilderModalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface CardFormAIBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getFullCardFormPayload: () => CardFormTemplateJson;
  onImportFullCardForm: (payload: CardFormTemplateJson) => void;
}

export function CardFormAIBuilderModal({
  open,
  onOpenChange,
  getFullCardFormPayload,
  onImportFullCardForm,
}: CardFormAIBuilderModalProps) {
  const [messages, setMessages] = useState<CardFormAIBuilderModalMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop();
  const extractedJson = lastAssistantMessage
    ? extractCardFormJsonFromText(lastAssistantMessage.content)
    : null;

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    setInputValue("");
    const userMsg: CardFormAIBuilderModalMessage = {
      id: generateStableId("ai-msg"),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const currentPayload = getFullCardFormPayload();
      const res = await api.forms.cardFormAiChat({
        message: trimmed,
        currentCardFormPayload: currentPayload as unknown as Record<string, unknown>,
        conversationHistory,
      });

      const assistantMsg: CardFormAIBuilderModalMessage = {
        id: generateStableId("ai-msg"),
        role: "assistant",
        content: res.content,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      toast({
        title: "AI request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, messages, getFullCardFormPayload, toast]);

  const handleApply = useCallback(() => {
    if (!extractedJson) return;
    onImportFullCardForm(extractedJson);
    onOpenChange(false);
    setMessages([]);
    setError(null);
    toast({
      title: "Form applied",
      description: "The generated form has been loaded. You can customize it further.",
    });
  }, [extractedJson, onImportFullCardForm, onOpenChange, toast]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setMessages([]);
        setInputValue("");
        setError(null);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Build with AI
          </DialogTitle>
          <DialogDescription>
            Describe the form you want. The AI will ask clarifying questions and
            then generate a card form you can load. For images, use URLs only;
            you can add uploads later in the builder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto rounded-md border bg-muted/30 p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Example: &quot;I want a short product-fit quiz with 3 questions
                and a percentage result&quot;
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[95%]",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                )}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking…</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Apply button when we have valid JSON */}
          {extractedJson && !loading && (
            <Button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply to form
            </Button>
          )}

          {/* Input */}
          <div className="flex gap-2 flex-shrink-0">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe your form or ask for changes..."
              className="min-h-[80px] resize-y"
              disabled={loading}
              rows={2}
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              size="icon"
              className="h-auto self-end"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
