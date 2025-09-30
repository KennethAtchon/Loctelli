import { Injectable, Logger } from '@nestjs/common';
import { StructuredPromptService } from './structured-prompt.service';
import { PromptTemplatesService } from '../prompt-templates/prompt-templates.service';

interface MessageHistory {
  from: string;
  message: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

// Interface to handle both message formats
interface MessageHistoryItem {
  from?: string;
  message?: string;
  role?: string;
  content?: string;
  timestamp?: string;
  metadata?: any;
}

/**
 * PromptHelperService - Focused on message composition for OpenAI API
 *
 * Responsibilities:
 * - Compose full conversation arrays (system prompt + message history) for OpenAI API
 * - Convert message history formats to standardized OpenAI format
 * - Handle conversation summarization integration
 *
 * NOT responsible for:
 * - Building system prompts (delegated to StructuredPromptService)
 * - Security validation (handled by security services)
 * - Prompt architecture (handled by enhanced OpenAI builder)
 */
@Injectable()
export class PromptHelperService {
  private readonly logger = new Logger(PromptHelperService.name);
  private readonly MAX_HISTORY = 20;

  constructor(
    private structuredPrompt: StructuredPromptService,
    private promptTemplatesService: PromptTemplatesService,
  ) {}



  /**
   * Convert message history item to standardized format
   * @param msg Message history item that could be in either format
   * @returns Standardized message with role and content
   */
  private convertMessageFormat(msg: MessageHistoryItem): { role: string; content: string } | null {
    // Handle new format (role/content)
    if (msg.role && msg.content) {
      return {
        role: msg.role,
        content: msg.content
      };
    }
    
    // Handle old format (from/message)
    if (msg.from && msg.message) {
      const role = msg.from === 'bot' ? 'assistant' : 'user';
      return {
        role,
        content: msg.message
      };
    }
    
    // Handle edge case where content might be in message field
    if (msg.content) {
      const role = msg.role || 'user';
      return {
        role,
        content: msg.content
      };
    }
    
    if (msg.message) {
      const role = msg.from === 'bot' ? 'assistant' : 'user';
      return {
        role,
        content: msg.message
      };
    }
    
    return null;
  }

  /**
   * Check if a message is a summarized conversation message
   * @param msg Message history item
   * @returns True if the message is a summarized conversation
   */
  private isSummarizedMessage(msg: MessageHistoryItem): boolean {
    return msg.role === 'system' && 
           msg.content && 
           msg.content.startsWith('[CONVERSATION SUMMARY]') &&
           msg.metadata && 
           typeof msg.metadata === 'object' &&
           msg.metadata.summarized === true;
  }

  /**
   * Compose the full prompt with system message and conversation history for OpenAI API
   * @param lead Lead entity from database
   * @param user User entity from database
   * @param strategy Strategy entity from database
   * @param history Conversation history
   * @returns Array of messages for OpenAI API
   */
  async composePrompt(lead: any, user: any, strategy: any, history: MessageHistoryItem[]): Promise<ChatMessage[]> {
    this.logger.debug(`[composePrompt] leadId=${lead.id}, history_length=${history.length}`);

    // Get active template for this subaccount and build context
    const activeTemplate = await this.promptTemplatesService.getActive(user?.subAccountId);
    const context = {
      lead,
      user,
      strategy,
      template: activeTemplate
    };

    // Get system prompt from structured prompt service
    const systemPrompt = await this.structuredPrompt.buildStructuredPrompt(context);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];
    
    for (const msg of history) {
      this.logger.debug(`[composePrompt] Processing message:`, msg);
      
      // Handle summarized messages specially
      if (this.isSummarizedMessage(msg)) {
        this.logger.debug(`[composePrompt] Processing summarized message: ${msg.content?.substring(0, 100)}...`);
        if (msg.content) {
          messages.push({
            role: 'system',
            content: msg.content
          });
        }
        continue;
      }
      
      const convertedMsg = this.convertMessageFormat(msg);
      if (convertedMsg && convertedMsg.content && typeof convertedMsg.content === 'string') {
        messages.push(convertedMsg);
        this.logger.debug(`[composePrompt] Added message: role=${convertedMsg.role}, content=${convertedMsg.content.substring(0, 50)}...`);
      } else {
        this.logger.warn(`[composePrompt] Skipping message with invalid content:`, msg);
      }
    }
    
    this.logger.log(`[composePrompt] Final messages array length: ${messages.length}`);
    this.logger.debug(`[composePrompt] Final messages: ${JSON.stringify(messages.map(m => ({ role: m.role, contentLength: m.content.length, contentPreview: m.content.substring(0, 50) })))}`);
    return messages;
  }
}
