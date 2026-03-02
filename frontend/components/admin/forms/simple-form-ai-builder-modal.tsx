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
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CreateFormTemplateDto } from "@/lib/forms/types";
import { extractSimpleFormJsonFromText } from "@/lib/forms/extract-simple-form-json";
import { generateStableId } from "@/lib/utils/stable-id";
import { cn } from "@/lib/utils";

export interface SimpleFormAIBuilderModalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface SimpleFormAIBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getFullSimpleFormPayload: () => CreateFormTemplateDto;
  onImportFullSimpleForm: (payload: CreateFormTemplateDto) => void;
}

export function SimpleFormAIBuilderModal({
  open,
  onOpenChange,
  getFullSimpleFormPayload,
  onImportFullSimpleForm,
}: SimpleFormAIBuilderModalProps) {
  const [messages, setMessages] = useState<SimpleFormAIBuilderModalMessage[]>(
    []
  );
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .pop();
  const extractedJson = lastAssistantMessage
    ? extractSimpleFormJsonFromText(lastAssistantMessage.content)
    : null;
  const lastMessageHasNoValidJson =
    !!lastAssistantMessage?.content && extractedJson === null;

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    setInputValue("");
    const userMsg: SimpleFormAIBuilderModalMessage = {
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
      const currentPayload = getFullSimpleFormPayload();
      const res = await api.forms.simpleFormAiChat({
        message: trimmed,
        currentSimpleFormPayload: currentPayload as unknown as Record<
          string,
          unknown
        >,
        conversationHistory,
      });

      const assistantMsg: SimpleFormAIBuilderModalMessage = {
        id: generateStableId("ai-msg"),
        role: "assistant",
        content: res.content,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      toast.error("AI request failed", { description: message });
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, messages, getFullSimpleFormPayload]);

  const handleApply = useCallback(() => {
    if (!extractedJson) return;
    setApplyError(null);
    try {
      onImportFullSimpleForm(extractedJson);
      onOpenChange(false);
      setMessages([]);
      setError(null);
      toast.success("Form applied", {
        description:
          "The generated form has been loaded. You can customize it further.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to apply form";
      setApplyError(message);
      toast.error("Apply failed", { description: message });
    }
  }, [extractedJson, onImportFullSimpleForm, onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setMessages([]);
        setInputValue("");
        setError(null);
        setApplyError(null);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] min-h-[70vh] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Build Simple Form with AI
          </DialogTitle>
          <DialogDescription>
            Describe the simple form you want. The AI will ask clarifying
            questions and then generate a single-page form you can load. For
            images, use URLs only; you can add uploads later in the builder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-[400px] gap-4">
          {/* Messages */}
          <div className="flex-1 min-h-[320px] overflow-y-auto rounded-md border bg-muted/30 p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Example: &quot;I want a contact form with name, email, and
                message fields&quot;
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg px-4 py-3 text-sm max-w-[95%]",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking…</span>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {applyError && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-destructive">
                Apply failed: {applyError}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  setInputValue(
                    () =>
                      `The previous JSON failed to apply: ${applyError}. Please output valid simple form JSON again (schema array with formType: "SIMPLE").`
                  );
                  setApplyError(null);
                }}
              >
                Send this error to the AI
              </Button>
            </div>
          )}
          {lastMessageHasNoValidJson && !loading && (
            <p className="text-sm text-muted-foreground">
              No valid form JSON found in the last message. Ask the AI to output
              a complete simple form (schema array, formType: "SIMPLE") in a
              code block or as raw JSON.
            </p>
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
              placeholder="Describe your simple form or ask for changes..."
              className="min-h-[96px] resize-y text-base"
              disabled={loading}
              rows={3}
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              size="lg"
              className="h-12 w-12 shrink-0 self-end"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
