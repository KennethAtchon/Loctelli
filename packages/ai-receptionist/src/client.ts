/**
 * AI Receptionist SDK - Main Client
 * Agent-centric architecture with clone pattern for multi-agent support
 */

import { AIReceptionistConfig } from './types';
import { TwilioProvider } from './providers/communication/twilio.provider';
import { OpenAIProvider } from './providers/ai/openai.provider';
import { GoogleCalendarProvider } from './providers/calendar/google-calendar.provider';
import { ConversationService } from './services/conversation.service';
import { ToolExecutionService } from './services/tool-execution.service';
import { CallService } from './services/call.service';
import { ToolRegistry } from './tools/registry';
import { CallsResource } from './resources/calls.resource';
import { SMSResource } from './resources/sms.resource';
import { EmailResource } from './resources/email.resource';
import { InMemoryConversationStore } from './storage/in-memory-conversation.store';
import { setupStandardTools } from './tools/standard';

/**
 * AIReceptionist - Agent-centric AI SDK
 *
 * Each instance represents one AI agent that can communicate through multiple channels.
 *
 * @example
 * ```typescript
 * const sarah = new AIReceptionist({
 *   agent: {
 *     name: 'Sarah',
 *     role: 'Sales Representative',
 *     personality: 'friendly and enthusiastic'
 *   },
 *   model: {
 *     provider: 'openai',
 *     apiKey: process.env.OPENAI_API_KEY!,
 *     model: 'gpt-4'
 *   },
 *   providers: {
 *     communication: {
 *       twilio: {
 *         accountSid: process.env.TWILIO_ACCOUNT_SID!,
 *         authToken: process.env.TWILIO_AUTH_TOKEN!,
 *         phoneNumber: process.env.TWILIO_PHONE_NUMBER!
 *       }
 *     }
 *   },
 *   tools: {
 *     defaults: ['calendar', 'booking']
 *   }
 * });
 *
 * // Initialize
 * await sarah.initialize();
 *
 * // Use across different channels
 * await sarah.calls.make({ to: '+1234567890' });
 * await sarah.sms.send({ to: '+1234567890', body: 'Hello!' });
 * ```
 */
export class AIReceptionist {
  // Resources (user-facing APIs)
  public readonly calls?: CallsResource;
  public readonly sms?: SMSResource;
  public readonly email?: EmailResource;

  // Internal components
  private config: AIReceptionistConfig;
  private twilioProvider?: TwilioProvider;
  private aiProvider!: OpenAIProvider;
  private calendarProvider?: GoogleCalendarProvider;
  private conversationService!: ConversationService;
  private toolExecutor!: ToolExecutionService;
  private toolRegistry!: ToolRegistry;
  private callService?: CallService;
  private initialized = false;

  constructor(config: AIReceptionistConfig) {
    this.config = config;

    // Validate required config
    if (!config.agent) {
      throw new Error('Agent configuration is required');
    }
    if (!config.model) {
      throw new Error('Model configuration is required');
    }

    if (config.debug) {
      console.log('[AIReceptionist] Created instance for agent:', config.agent.name);
    }
  }

  /**
   * Initialize the SDK
   * Call this before using any resources
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[AIReceptionist] Already initialized');
      return;
    }

    console.log(`[AIReceptionist] Initializing agent: ${this.config.agent.name}`);

    // 1. Initialize conversation store
    this.conversationService = new ConversationService(
      this.config.conversationStore || new InMemoryConversationStore()
    );

    // 2. Initialize tool registry
    this.toolRegistry = new ToolRegistry();

    // 3. Setup standard tools if requested
    if (this.config.tools?.defaults) {
      await setupStandardTools(
        this.toolRegistry,
        this.config.tools,
        this.config.providers
      );
    }

    // 4. Register custom tools
    if (this.config.tools?.custom) {
      for (const tool of this.config.tools.custom) {
        this.toolRegistry.register(tool);
      }
    }

    // 5. Initialize tool executor
    this.toolExecutor = new ToolExecutionService(
      this.toolRegistry,
      this.config.onToolExecute,
      this.config.onToolError
    );

    // 6. Initialize AI provider
    this.aiProvider = new OpenAIProvider(this.config.model, this.config.agent);
    await this.aiProvider.initialize();

    // 7. Initialize communication providers if configured
    if (this.config.providers.communication?.twilio) {
      this.twilioProvider = new TwilioProvider(this.config.providers.communication.twilio);
      await this.twilioProvider.initialize();

      // Initialize call service
      this.callService = new CallService(
        this.twilioProvider,
        this.aiProvider,
        this.conversationService,
        this.toolExecutor,
        this.config.agent
      );

      // Initialize resources
      (this as any).calls = new CallsResource(this.callService);
      (this as any).sms = new SMSResource(this.twilioProvider);
    }

    // 8. Initialize calendar provider if configured
    if (this.config.providers.calendar?.google) {
      this.calendarProvider = new GoogleCalendarProvider(this.config.providers.calendar.google);
      await this.calendarProvider.initialize();
    }

    // 9. Initialize email resource (basic for now)
    (this as any).email = new EmailResource();

    this.initialized = true;

    console.log(`[AIReceptionist] Initialized successfully`);
    console.log(`[AIReceptionist] - Registered tools: ${this.toolRegistry.count()}`);
    console.log(`[AIReceptionist] - Available channels: ${[
      this.calls ? 'calls' : null,
      this.sms ? 'sms' : null,
      this.email ? 'email' : null
    ].filter(Boolean).join(', ')}`);
  }

  /**
   * Clone this instance with different agent/tool configuration
   * Providers are shared for efficiency
   *
   * @example
   * ```typescript
   * const sarah = new AIReceptionist({ ... });
   * await sarah.initialize();
   *
   * // Create Bob with same infrastructure but different personality
   * const bob = sarah.clone({
   *   agent: {
   *     name: 'Bob',
   *     role: 'Support Specialist',
   *     personality: 'patient and helpful'
   *   },
   *   tools: {
   *     defaults: ['ticketing', 'knowledgeBase']
   *   }
   * });
   * await bob.initialize();
   * ```
   */
  clone(overrides: Partial<AIReceptionistConfig>): AIReceptionist {
    console.log(`[AIReceptionist] Cloning instance with overrides`);

    const clonedConfig: AIReceptionistConfig = {
      // Merge agent config
      agent: {
        ...this.config.agent,
        ...overrides.agent
      },

      // Use model from override or original
      model: overrides.model || this.config.model,

      // Merge tool config
      tools: overrides.tools || this.config.tools,

      // Reuse providers (shared resources)
      providers: this.config.providers,

      // Other config
      conversationStore: overrides.conversationStore || this.config.conversationStore,
      notifications: overrides.notifications || this.config.notifications,
      analytics: overrides.analytics || this.config.analytics,
      debug: overrides.debug !== undefined ? overrides.debug : this.config.debug,

      // Event handlers
      onToolExecute: overrides.onToolExecute || this.config.onToolExecute,
      onToolError: overrides.onToolError || this.config.onToolError,
      onConversationStart: overrides.onConversationStart || this.config.onConversationStart,
      onConversationEnd: overrides.onConversationEnd || this.config.onConversationEnd
    };

    return new AIReceptionist(clonedConfig);
  }

  /**
   * Get the tool registry for runtime tool management
   *
   * @example
   * ```typescript
   * const registry = client.getToolRegistry();
   * registry.register(myCustomTool);
   * registry.unregister('old-tool');
   * ```
   */
  getToolRegistry(): ToolRegistry {
    this.ensureInitialized();
    return this.toolRegistry;
  }

  /**
   * Dispose of all resources
   */
  async dispose(): Promise<void> {
    console.log('[AIReceptionist] Disposing');

    if (this.twilioProvider) {
      await this.twilioProvider.dispose();
    }

    if (this.aiProvider) {
      await this.aiProvider.dispose();
    }

    if (this.calendarProvider) {
      await this.calendarProvider.dispose();
    }

    this.initialized = false;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AIReceptionist not initialized. Call initialize() first.');
    }
  }
}
