/**
 * AI Orchestrator
 * Manages AI model interactions, tool calling, and decision-making
 */

import { AIModelConfig, AgentConfig } from '../types';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  name: string;
  arguments: any;
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length';
}

export interface AIProvider {
  sendMessage(messages: AIMessage[]): Promise<AIResponse>;
  streamMessage(messages: AIMessage[], onChunk: (text: string) => void): Promise<AIResponse>;
}

/**
 * AI Orchestrator - manages conversation with AI models and tool execution
 */
export class AIOrchestrator {
  private provider: AIProvider;
  private agentConfig: AgentConfig;
  private toolCallHandlers: Map<string, (args: any) => Promise<any>> = new Map();

  constructor(modelConfig: AIModelConfig, agentConfig: AgentConfig) {
    this.agentConfig = agentConfig;

    // Initialize the appropriate AI provider
    switch (modelConfig.provider) {
      case 'openai':
        this.provider = new OpenAIProvider(modelConfig);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(modelConfig);
        break;
      case 'gemini':
        this.provider = new GeminiProvider(modelConfig);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
    }
  }

  /**
   * Register a tool call handler
   */
  onToolCall(handler: (toolName: string, args: any) => Promise<any>) {
    // Store a generic handler that will be called for any tool
    this.toolCallHandlers.set('*', handler);
  }

  /**
   * Build system prompt based on agent configuration
   */
  private buildSystemPrompt(): string {
    const { name, role, personality, instructions, businessInfo, tools } = this.agentConfig;

    let prompt = `You are ${name}, a ${role}.`;

    if (personality) {
      prompt += ` Your personality is ${personality}.`;
    }

    if (businessInfo) {
      prompt += `\n\nBusiness Information:\n`;
      prompt += `- Company: ${businessInfo.name}\n`;
      prompt += `- Services: ${businessInfo.services.join(', ')}\n`;
      prompt += `- Hours: ${businessInfo.hours}\n`;
      if (businessInfo.location) {
        prompt += `- Location: ${businessInfo.location}\n`;
      }
      if (businessInfo.pricing) {
        prompt += `- Pricing: ${businessInfo.pricing}\n`;
      }
    }

    if (tools && tools.length > 0) {
      prompt += `\n\nYou have access to the following tools:\n`;
      if (tools.includes('calendar')) {
        prompt += `- calendar: Book appointments in Google Calendar\n`;
      }
      if (tools.includes('sheets')) {
        prompt += `- sheets: Log information to Google Sheets\n`;
      }
      if (tools.includes('sms')) {
        prompt += `- sms: Send SMS messages\n`;
      }
      if (tools.includes('twitter')) {
        prompt += `- twitter: Post updates to Twitter\n`;
      }
      if (tools.includes('email')) {
        prompt += `- email: Send email messages\n`;
      }
    }

    if (instructions) {
      prompt += `\n\nInstructions:\n${instructions}`;
    }

    return prompt;
  }

  /**
   * Process a conversation turn (handles tool calling loop)
   */
  async processConversation(messages: AIMessage[]): Promise<string> {
    // Add system prompt at the beginning
    const systemPrompt = this.buildSystemPrompt();
    const fullMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    let response = await this.provider.sendMessage(fullMessages);

    // Handle tool calls if any
    while (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults: AIMessage[] = [];

      for (const toolCall of response.toolCalls) {
        try {
          const handler = this.toolCallHandlers.get('*');
          if (!handler) {
            throw new Error('No tool handler registered');
          }

          const result = await handler(toolCall.name, toolCall.arguments);
          toolResults.push({
            role: 'assistant',
            content: `Tool ${toolCall.name} executed successfully. Result: ${JSON.stringify(result)}`,
          });
        } catch (error: any) {
          toolResults.push({
            role: 'assistant',
            content: `Tool ${toolCall.name} failed: ${error.message}`,
          });
        }
      }

      // Continue conversation with tool results
      fullMessages.push(...toolResults);
      response = await this.provider.sendMessage(fullMessages);
    }

    return response.content;
  }

  /**
   * Stream a response (for real-time conversation)
   */
  async streamResponse(
    messages: AIMessage[],
    onChunk: (text: string) => void
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const fullMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await this.provider.streamMessage(fullMessages, onChunk);
    return response.content;
  }
}
