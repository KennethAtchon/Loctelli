/**
 * Configuration Manager - Internal singleton for sharing resources
 * Ensures that resources like Twilio clients and AI orchestrators are reused
 * when multiple resources share the same configuration
 */

import { TwilioConfig, AIModelConfig, AgentConfig } from '../types';
import { TwilioOrchestrator } from '../orchestrators/twilio.orchestrator';
import { AIOrchestrator } from '../orchestrators/ai.orchestrator';
import { ConversationManager } from '../orchestrators/conversation.manager';

/**
 * Cache key for Twilio clients
 */
interface TwilioCacheKey {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

/**
 * Cache key for AI orchestrators
 */
interface AICacheKey {
  provider: string;
  apiKey: string;
  model: string;
  agentName: string;
  agentRole: string;
}

/**
 * Internal configuration manager that maintains shared resources
 * Uses WeakMap for automatic garbage collection when configs are no longer referenced
 */
export class ConfigurationManager {
  // Singleton instance
  private static instance: ConfigurationManager;

  // Cache for shared resources
  private twilioClients = new Map<string, TwilioOrchestrator>();
  private aiOrchestrators = new Map<string, AIOrchestrator>();
  private conversationManagers = new Map<string, ConversationManager>();

  /**
   * Private constructor for singleton
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Generate cache key for Twilio config
   */
  private getTwilioKey(config: TwilioConfig): string {
    return `twilio:${config.accountSid}:${config.phoneNumber}`;
  }

  /**
   * Generate cache key for AI orchestrator
   */
  private getAIKey(modelConfig: AIModelConfig, agentConfig: AgentConfig): string {
    return `ai:${modelConfig.provider}:${modelConfig.model}:${agentConfig.name}:${agentConfig.role}`;
  }

  /**
   * Get or create Twilio orchestrator
   * Reuses existing instance if configuration matches
   */
  getTwilioOrchestrator(
    twilioConfig: TwilioConfig,
    modelConfig: AIModelConfig,
    agentConfig: AgentConfig
  ): TwilioOrchestrator {
    const key = this.getTwilioKey(twilioConfig);

    if (!this.twilioClients.has(key)) {
      // Create conversation manager with AI orchestrator
      const conversationManager = this.getConversationManager(modelConfig, agentConfig);

      // Create new Twilio orchestrator
      const orchestrator = new TwilioOrchestrator(twilioConfig, conversationManager);
      this.twilioClients.set(key, orchestrator);
    }

    return this.twilioClients.get(key)!;
  }

  /**
   * Get or create AI orchestrator
   * Reuses existing instance if configuration matches
   */
  getAIOrchestrator(modelConfig: AIModelConfig, agentConfig: AgentConfig): AIOrchestrator {
    const key = this.getAIKey(modelConfig, agentConfig);

    if (!this.aiOrchestrators.has(key)) {
      const orchestrator = new AIOrchestrator(modelConfig, agentConfig);
      this.aiOrchestrators.set(key, orchestrator);
    }

    return this.aiOrchestrators.get(key)!;
  }

  /**
   * Get or create conversation manager
   * Reuses existing instance if configuration matches
   */
  getConversationManager(
    modelConfig: AIModelConfig,
    agentConfig: AgentConfig
  ): ConversationManager {
    const key = this.getAIKey(modelConfig, agentConfig);

    if (!this.conversationManagers.has(key)) {
      const aiOrchestrator = this.getAIOrchestrator(modelConfig, agentConfig);
      const manager = new ConversationManager(aiOrchestrator);
      this.conversationManagers.set(key, manager);
    }

    return this.conversationManagers.get(key)!;
  }

  /**
   * Clear all cached resources
   * Useful for testing or when you want to force re-initialization
   */
  clearCache(): void {
    this.twilioClients.clear();
    this.aiOrchestrators.clear();
    this.conversationManagers.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): {
    twilioClients: number;
    aiOrchestrators: number;
    conversationManagers: number;
  } {
    return {
      twilioClients: this.twilioClients.size,
      aiOrchestrators: this.aiOrchestrators.size,
      conversationManagers: this.conversationManagers.size,
    };
  }
}

/**
 * Get the singleton configuration manager instance
 */
export function getConfigManager(): ConfigurationManager {
  return ConfigurationManager.getInstance();
}
