import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AgentFactoryService } from './agent-factory.service';
import { AgentConfigService } from './agent-config.service';
import { GenerateTextRequestDto, GenerateTextResponseDto } from './dto/index';
import { BookingTools } from './custom-tools/booking-tools';
import { LeadManagementTools } from './custom-tools/lead-management-tools';
import type { Message, AgentInstance } from '@atchonk/ai-receptionist';

/**
 * Main service for AI-receptionist integration
 * Provides unified interface for chat functionality using AI-receptionist SDK
 */
@Injectable()
export class AIReceptionistService {
  private readonly logger = new Logger(AIReceptionistService.name);

  constructor(
    private prisma: PrismaService,
    private agentFactory: AgentFactoryService,
    private agentConfig: AgentConfigService,
    private bookingTools: BookingTools,
    private leadManagementTools: LeadManagementTools
  ) {}

  /**
   * Generate a text response for a lead message
   */
  async generateTextResponse(request: GenerateTextRequestDto): Promise<string> {
    const { leadId, message, context } = request;

    this.logger.debug(`Generating text response for leadId=${leadId}`);

    try {
      // Get lead and user information
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          regularUser: true,
          strategy: true
        }
      });

      if (!lead) {
        throw new NotFoundException(`Lead with ID ${leadId} not found`);
      }

      const userId = context?.userId || lead.regularUserId;

      // Get agent configuration
      const agentConfig = await this.agentConfig.getAgentConfig(userId, leadId);
      const modelConfig = this.agentConfig.getModelConfig();

      // Merge model config into agent config
      const fullAgentConfig = {
        ...agentConfig,
        model: modelConfig
      };

      // Get or create agent instance
      const agent = await this.agentFactory.getOrCreateAgent(
        userId,
        leadId,
        fullAgentConfig
      );

      // Register custom tools for this agent instance
      await this.registerCustomTools(agent, lead.timezone || undefined);

      // Load conversation history into agent memory
      await this.loadConversationHistory(agent, leadId);

      // Generate response using AI-receptionist text resource
      const response = await agent.text.generate({
        prompt: message,
        conversationId: `lead-${leadId}`,
        metadata: {
          leadId,
          userId,
          strategyId: lead.strategyId,
          leadData: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company
          }
        }
      });

      // Save conversation to database (for backward compatibility)
      await this.saveMessageToHistory(leadId, message, response.text);

      this.logger.debug(`Generated response for leadId=${leadId}: ${response.text.substring(0, 50)}...`);
      return response.text;
    } catch (error) {
      this.logger.error(`Error generating text response for leadId=${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Initiate a conversation with a lead (AI sends first message)
   */
  async initiateConversation(leadId: number): Promise<string> {
    this.logger.debug(`Initiating conversation for leadId=${leadId}`);

    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          regularUser: true,
          strategy: true
        }
      });

      if (!lead) {
        throw new NotFoundException(`Lead with ID ${leadId} not found`);
      }

      // Check if conversation already started
      const existingHistory = lead.messageHistory 
        ? JSON.parse(lead.messageHistory as string) 
        : [];

      if (existingHistory.length > 0) {
        this.logger.warn(`Conversation already initiated for leadId=${leadId}`);
        return existingHistory[existingHistory.length - 1].content;
      }

      // Get agent configuration
      const agentConfig = await this.agentConfig.getAgentConfig(lead.regularUserId, leadId);
      const modelConfig = this.agentConfig.getModelConfig();

      const fullAgentConfig = {
        ...agentConfig,
        model: modelConfig
      };

      // Get or create agent instance
      const agent = await this.agentFactory.getOrCreateAgent(
        lead.regularUserId,
        leadId,
        fullAgentConfig
      );

      // Register custom tools for this agent instance
      await this.registerCustomTools(agent, lead.timezone || undefined);

      // Generate initial greeting
      const greeting = await agent.text.generate({
        prompt: 'Generate a warm, personalized opening message to initiate this conversation. Introduce yourself and express genuine interest in helping them. Keep it friendly and conversational.',
        conversationId: `lead-${leadId}`,
        metadata: {
          leadId,
          userId: lead.regularUserId,
          strategyId: lead.strategyId,
          leadData: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company
          }
        }
      });

      // Save greeting to history
      await this.saveMessageToHistory(leadId, '', greeting.text, 'assistant');

      this.logger.debug(`Conversation initiated for leadId=${leadId}`);
      return greeting.text;
    } catch (error) {
      this.logger.error(`Error initiating conversation for leadId=${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Get conversation history for a lead
   */
  async getConversationHistory(leadId: number): Promise<Message[]> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { messageHistory: true }
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    if (!lead.messageHistory) {
      return [];
    }

    try {
      const history = JSON.parse(lead.messageHistory as string);
      // Convert to AI-receptionist Message format
      return history.map((msg: any) => ({
        role: msg.role || (msg.from === 'bot' ? 'assistant' : 'user'),
        content: msg.content || msg.message || '',
        timestamp: msg.timestamp || new Date().toISOString()
      }));
    } catch (error) {
      this.logger.error(`Error parsing message history for leadId=${leadId}:`, error);
      return [];
    }
  }

  /**
   * Clear conversation history for a lead
   */
  async clearConversation(leadId: number): Promise<void> {
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        messageHistory: JSON.stringify([]),
        lastMessage: null,
        lastMessageDate: null
      }
    });

    // Also clear from agent memory if agent exists
    // Note: This would require tracking which agents are active, which we can add later
    this.logger.debug(`Cleared conversation history for leadId=${leadId}`);
  }

  /**
   * Register custom tools with an agent instance
   * Note: Tools are registered at factory level, so we need to register them before creating agents
   * For now, we'll skip tool registration per-agent and register them at factory initialization
   */
  private async registerCustomTools(agent: AgentInstance, leadTimezone?: string): Promise<void> {
    try {
      // Tools are registered at factory level in AgentFactoryService
      // Per-agent tool registration would require accessing the factory's tool registry
      // For now, we'll rely on factory-level tool registration
      this.logger.debug(`Custom tools should be registered at factory level`);
    } catch (error) {
      this.logger.warn(`Failed to register custom tools: ${error.message}`);
      // Don't throw - tools are optional
    }
  }

  /**
   * Load conversation history into agent memory
   */
  private async loadConversationHistory(agent: any, leadId: number): Promise<void> {
    const history = await this.getConversationHistory(leadId);
    
    // Load messages into agent memory
    // Note: AI-receptionist handles memory internally, but we may need to sync
    // This is a placeholder for future memory sync functionality
    this.logger.debug(`Loaded ${history.length} messages into agent memory for leadId=${leadId}`);
  }

  /**
   * Save message to database history (for backward compatibility)
   */
  private async saveMessageToHistory(
    leadId: number,
    userMessage: string,
    aiMessage: string,
    firstMessageRole: 'user' | 'assistant' = 'assistant'
  ): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { messageHistory: true }
    });

    if (!lead) {
      return;
    }

    const existingHistory = lead.messageHistory 
      ? JSON.parse(lead.messageHistory as string) 
      : [];

    const newMessages: any[] = [];

    // Add first message if it's an initiation
    if (firstMessageRole === 'assistant' && !userMessage) {
      newMessages.push({
        role: 'assistant',
        content: aiMessage,
        timestamp: new Date().toISOString()
      });
    } else {
      // Add user message
      if (userMessage) {
        newMessages.push({
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString()
        });
      }

      // Add AI response
      newMessages.push({
        role: 'assistant',
        content: aiMessage,
        timestamp: new Date().toISOString()
      });
    }

    const updatedHistory = [...existingHistory, ...newMessages];

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        messageHistory: JSON.stringify(updatedHistory),
        lastMessage: aiMessage,
        lastMessageDate: new Date().toISOString()
      }
    });
  }
}

