import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConversationHistoryService } from './conversation-history.service';
import { SystemPromptBuilderService } from './system-prompt-builder.service';
import { AgentConfigService } from '../config/agent-config.service';
import { BookingToolsVercel } from '../tools/booking-tools-vercel';
import { LeadManagementToolsVercel } from '../tools/lead-management-tools-vercel';
import type {
  UserModelMessage,
  AssistantModelMessage,
  TextPart,
  ImagePart,
  ModelMessage,
  LanguageModel,
  SystemModelMessage,
} from 'ai';

interface AIConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
}

/**
 * Vercel AI SDK service for text generation
 * Config-based approach: builds config per request, no agent instances
 */
@Injectable()
export class VercelAIService {
  private readonly logger = new Logger(VercelAIService.name);

  constructor(
    private prisma: PrismaService,
    private conversationHistory: ConversationHistoryService,
    private systemPromptBuilder: SystemPromptBuilderService,
    private agentConfig: AgentConfigService,
    private bookingTools: BookingToolsVercel,
    private leadManagementTools: LeadManagementToolsVercel,
  ) {}

  /**
   * Generate non-streaming text response
   * Config-based approach: builds config per request, no agent instances
   * @param saveUserMessage If false, skips saving the user message to history (useful for system prompts)
   */
  async generateTextResponse(
    leadId: number,
    message: string,
    userId: number,
    imageData?: Array<{
      imageBase64: string;
      imageName?: string;
      imageType?: string;
    }>,
    saveUserMessage: boolean = true,
  ): Promise<string> {
    this.logger.debug(
      `Generating non-streaming response for leadId=${leadId}, userId=${userId}${imageData ? ' with image' : ''}`,
    );

    try {
      // Verify lead exists
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          regularUser: true,
          strategy: true,
        },
      });

      if (!lead) {
        throw new NotFoundException(`Lead with ID ${leadId} not found`);
      }

      // Build config for this request
      const config = await this.buildConfig(userId, leadId);

      // Get conversation history (memory)
      const history = await this.conversationHistory.getHistory(
        leadId,
        config.contextWindow,
      );

      // Build messages array (history + current user message) with strict typing
      const currentUserMessage: UserModelMessage =
        imageData && imageData.length > 0
          ? {
              role: 'user',
              content: [
                { type: 'text', text: message } satisfies TextPart,
                ...imageData.map(
                  (img): ImagePart => ({
                    type: 'image',
                    image: img.imageBase64,
                    ...(img.imageType && { mediaType: img.imageType }),
                  }),
                ),
              ],
            }
          : {
              role: 'user',
              content: message,
            };

      const messages: ModelMessage[] = [...history, currentUserMessage];

      // Configure model with strict typing
      const model: LanguageModel = openai(config.model);

      // Build tools for this request
      const tools = this.buildTools(userId, leadId, lead.timezone || undefined);

      this.logger.log(
        `[generateTextResponse] tools: ${JSON.stringify(tools)}`,
      );

      // Save user message to history BEFORE generating response (correct chronological order)
      // Skip if this is a system prompt (e.g., for initiateConversation)
      if (saveUserMessage) {
        await this.conversationHistory.saveMessage(leadId, 'user', message);
      }

      // Generate text with tools
      // generateText automatically handles tool calls in a loop:
      // 1. Model calls tool -> 2. Tool executes -> 3. Model generates text response
      const result = await generateText({
        model: model satisfies LanguageModel,
        system: config.systemPrompt satisfies
          | string
          | SystemModelMessage
          | SystemModelMessage[],
        messages: messages satisfies ModelMessage[],
        tools,
      });

      // Log tool calls and results for debugging
      const toolCalls = (result as any).toolCalls;
      const toolResults = (result as any).toolResults;
      
      if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
        this.logger.debug(
          `Tool calls made for leadId=${leadId}: ${toolCalls.map((tc: any) => `${tc.toolName || tc.toolCallId || 'unknown'}`).join(', ')}`,
        );
      }
      if (toolResults && Array.isArray(toolResults) && toolResults.length > 0) {
        this.logger.debug(
          `Tool results for leadId=${leadId}: ${toolResults.map((tr: any) => {
            const toolName = tr.toolName || tr.toolCallId || 'unknown';
            // Try multiple possible properties where the result might be stored
            const resultValue = 
              tr.result !== undefined ? tr.result :
              tr.value !== undefined ? tr.value :
              tr.content !== undefined ? tr.content :
              tr;
            const resultStr = typeof resultValue === 'string' 
              ? resultValue.substring(0, 100) 
              : JSON.stringify(resultValue).substring(0, 200);
            return `${toolName}: ${resultStr}`;
          }).join(', ')}`,
        );
      }

      // Handle empty text response after tool calls
      // The SDK should automatically generate a text response after tool execution,
      // but if it doesn't, we'll use the tool result or a default message
      let responseText = result.text;
      if (!responseText || responseText.trim() === '') {
        if (toolCalls && toolCalls.length > 0 && toolResults && toolResults.length > 0) {
          // Tools were executed but no text response was generated
          // Use the tool result as the response (tools return user-friendly messages)
          const toolResult = toolResults[0];
          
          // Try multiple possible properties where the result might be stored
          // Vercel AI SDK tool results can have the actual result in different places
          let resultValue: any = undefined;
          if (toolResult.result !== undefined) {
            resultValue = toolResult.result;
          } else if (toolResult.value !== undefined) {
            resultValue = toolResult.value;
          } else if (toolResult.content !== undefined) {
            resultValue = toolResult.content;
          } else if (typeof toolResult === 'string') {
            resultValue = toolResult;
          } else {
            // Log the full structure for debugging
            this.logger.debug(
              `Full tool result structure for leadId=${leadId}: ${JSON.stringify(toolResult).substring(0, 500)}`,
            );
            // Try to find any string property in the object
            for (const key in toolResult) {
              if (typeof toolResult[key] === 'string' && toolResult[key].length > 0) {
                resultValue = toolResult[key];
                break;
              }
            }
          }
          
          if (typeof resultValue === 'string' && resultValue.trim().length > 0) {
            responseText = resultValue;
            this.logger.debug(
              `Using tool result as response for leadId=${leadId}: ${responseText.substring(0, 50)}...`,
            );
          } else {
            // Tool returned non-string result, generate a generic confirmation
            this.logger.warn(
              `Empty text response after tool calls for leadId=${leadId}. Tool: ${toolResult.toolName || 'unknown'}, Result type: ${typeof resultValue}, Full result: ${JSON.stringify(toolResult).substring(0, 200)}`,
            );
            responseText = "I've completed that for you. Is there anything else I can help with?";
          }
        } else {
          // No tool calls and no text - this is unexpected
          this.logger.warn(
            `Empty text response with no tool calls for leadId=${leadId}. Finish reason: ${(result as any).finishReason || 'unknown'}`,
          );
          responseText = "I'm here to help. Could you please rephrase your question?";
        }
      }

      // Save assistant message to history after generation completes
      await this.conversationHistory.saveMessage(
        leadId,
        'assistant',
        responseText,
      );

      this.logger.debug(
        `Generated response for leadId=${leadId}: ${responseText.substring(0, 50)}...`,
      );
      return responseText;
    } catch (error) {
      this.logger.error(
        `Error generating non-streaming response for leadId=${leadId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Build AI configuration for this request
   * Fetches strategy, prompt template, and builds config
   */
  private async buildConfig(userId: number, leadId: number): Promise<AIConfig> {
    // Get agent configuration from database
    const agentConfig = await this.agentConfig.getAgentConfig(userId, leadId);
    const modelConfig = this.agentConfig.getModelConfig();

    // Build system prompt from config
    const systemPrompt =
      this.systemPromptBuilder.buildSystemPrompt(agentConfig);

    return {
      systemPrompt,
      model: modelConfig.model || 'gpt-4o-mini',
      temperature: modelConfig.temperature ?? 0.7,
      maxTokens: modelConfig.maxTokens ?? 500,
      contextWindow: agentConfig.memory?.contextWindow || 20,
    };
  }

  /**
   * Build tools for this request
   * Tools are built with userId and leadId in closure
   */
  private buildTools(
    userId: number,
    leadId: number,
    leadTimezone?: string,
  ): Record<string, any> {
    return {
      book_meeting: this.bookingTools.createBookMeetingTool(
        userId,
        leadId,
        leadTimezone,
      ),
      check_availability: this.bookingTools.createCheckAvailabilityTool(userId),
      update_lead_details:
        this.leadManagementTools.createUpdateLeadDetailsTool(leadId),
      update_conversation_state:
        this.leadManagementTools.createUpdateConversationStateTool(leadId),
    };
  }
}
