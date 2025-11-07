# AI Chat Flow Documentation
## How the AI-Receptionist System Works

This document explains the complete flow of how user messages are processed through the AI-receptionist system, from initial request to final response.

---

## Table of Contents

1. [Overview](#overview)
2. [Main Chat Flow](#main-chat-flow)
3. [Agent Creation & Configuration](#agent-creation--configuration)
4. [Message Processing](#message-processing)
5. [Tool Execution Flow](#tool-execution-flow)
6. [Webhook Flows](#webhook-flows)
7. [Memory & History Management](#memory--history-management)

---

## Overview

The system uses the `@atchonk/ai-receptionist` SDK with a factory pattern for efficient agent management. Each conversation is handled by an AI agent instance that is configured based on the user's strategy, prompt templates, and lead information.

**Key Components:**
- **ChatController**: Entry point for HTTP requests
- **ChatService**: Orchestrates chat operations
- **AIReceptionistService**: Main integration service with AI-receptionist SDK
- **AgentFactoryService**: Manages agent instance creation and caching
- **AgentConfigService**: Builds agent configurations from database entities
- **AgentConfigMapper**: Maps database entities to SDK configuration format

---

## Main Chat Flow

### Sequence Diagram: User Sends a Message

```mermaid
sequenceDiagram
    participant User
    participant ChatController
    participant ChatService
    participant AIReceptionistService
    participant AgentFactoryService
    participant AgentConfigService
    participant AgentInstance
    participant Database

    User->>ChatController: POST /chat/send
    Note over ChatController: Validates request<br/>Extracts leadId, content
    
    ChatController->>ChatService: sendMessage(chatMessageDto)
    
    ChatService->>Database: Find lead by leadId
    Database-->>ChatService: Lead data (with userId, strategyId)
    
    ChatService->>AIReceptionistService: generateTextResponse({leadId, message, context})
    
    AIReceptionistService->>Database: Fetch lead with user & strategy
    Database-->>AIReceptionistService: Full lead data
    
    AIReceptionistService->>AgentConfigService: getAgentConfig(userId, leadId)
    
    AgentConfigService->>Database: Fetch user, lead, strategy, promptTemplate
    Database-->>AgentConfigService: All entities
    
    AgentConfigService->>AgentConfigMapper: Map entities to config
    AgentConfigMapper-->>AgentConfigService: AgentInstanceConfig
    
    AgentConfigService-->>AIReceptionistService: AgentInstanceConfig
    
    AIReceptionistService->>AgentFactoryService: getOrCreateAgent(userId, leadId, config)
    
    alt Agent exists in cache
        AgentFactoryService-->>AIReceptionistService: Cached AgentInstance
    else Create new agent
        AgentFactoryService->>AIReceptionistFactory: createAgent(config)
        AIReceptionistFactory-->>AgentFactoryService: New AgentInstance
        AgentFactoryService->>AgentFactoryService: Cache agent instance
        AgentFactoryService-->>AIReceptionistService: AgentInstance
    end
    
    AIReceptionistService->>AgentInstance: text.generate({prompt, conversationId, metadata})
    
    Note over AgentInstance: Agent processes message:<br/>1. Load conversation history<br/>2. Build system prompt<br/>3. Call AI provider<br/>4. Execute tools (if needed)<br/>5. Generate response
    
    AgentInstance-->>AIReceptionistService: Response {text, metadata}
    
    AIReceptionistService->>Database: Save message to history
    Database-->>AIReceptionistService: Success
    
    AIReceptionistService-->>ChatService: AI response text
    
    ChatService->>Database: Update lead (lastMessage, lastMessageDate)
    Database-->>ChatService: Success
    
    ChatService-->>ChatController: Response with user & AI messages
    ChatController-->>User: HTTP 200 with conversation data
```

---

## Agent Creation & Configuration

### Sequence Diagram: Agent Configuration Building

```mermaid
sequenceDiagram
    participant AIReceptionistService
    participant AgentConfigService
    participant AgentConfigMapper
    participant Database
    participant PromptTemplatesService

    AIReceptionistService->>AgentConfigService: getAgentConfig(userId, leadId)
    
    par Fetch Entities in Parallel
        AgentConfigService->>Database: Find user with subAccount
        Database-->>AgentConfigService: User entity
    and
        AgentConfigService->>Database: Find lead with strategy
        Database-->>AgentConfigService: Lead entity with strategy
    and
        AgentConfigService->>PromptTemplatesService: getActive(subAccountId)
        PromptTemplatesService->>Database: Find active prompt template
        Database-->>PromptTemplatesService: PromptTemplate entity
        PromptTemplatesService-->>AgentConfigService: PromptTemplate
    end
    
    AgentConfigService->>AgentConfigMapper: mapIdentity(strategy, promptTemplate, user)
    AgentConfigMapper-->>AgentConfigService: IdentityConfig
    
    AgentConfigService->>AgentConfigMapper: mapPersonality(strategy, promptTemplate)
    AgentConfigMapper-->>AgentConfigService: PersonalityConfig
    
    AgentConfigService->>AgentConfigMapper: mapKnowledge(strategy, promptTemplate, lead)
    AgentConfigMapper-->>AgentConfigService: KnowledgeConfig
    
    AgentConfigService->>AgentConfigMapper: mapGoals(strategy, promptTemplate)
    AgentConfigMapper-->>AgentConfigService: GoalConfig
    
    AgentConfigService->>AgentConfigService: Build AgentInstanceConfig
    Note over AgentConfigService: Config includes:<br/>- identity<br/>- personality<br/>- knowledge<br/>- goals<br/>- memory (contextWindow)
    
    AgentConfigService-->>AIReceptionistService: Complete AgentInstanceConfig
```

### Configuration Mapping Details

**Identity Mapping:**
- `name`: From `strategy.aiName` or `promptTemplate.name`
- `role`: From `strategy.aiRole` or `promptTemplate.category`
- `title`: From `strategy.name`
- `backstory`: From `strategy.companyBackground` or `promptTemplate.description`
- `specializations`: Extracted from strategy and prompt template

**Personality Mapping:**
- `traits`: Extracted from strategy and prompt template
- `communicationStyle`: Mapped from strategy settings
- `emotionalIntelligence`: Set to 'high'
- `adaptability`: Set to 'high'

**Knowledge Mapping:**
- `domain`: From `strategy.industryContext` or `promptTemplate.category`
- `expertise`: Extracted from strategy and prompt template
- `industries`: From `strategy.tag` or `promptTemplate.category`
- `languages`: Default to English

**Goals Mapping:**
- `primary`: Based on `strategy.closingStrategy` or default
- `secondary`: Extracted from strategy (qualification questions, objection handling, etc.)

---

## Message Processing

### Sequence Diagram: Agent Processing a Message

```mermaid
sequenceDiagram
    participant AIReceptionistService
    participant AgentInstance
    participant Agent (Core)
    participant MemoryManager
    participant SystemPromptBuilder
    participant AIProvider
    participant ToolRegistry
    participant Database

    AIReceptionistService->>AgentInstance: text.generate({prompt, conversationId, metadata})
    
    AgentInstance->>Agent: process(request)
    
    Note over Agent: Security Validation<br/>(InputValidator checks for<br/>prompt injection, etc.)
    
    Agent->>MemoryManager: getConversationHistory(conversationId)
    
    alt Long-term memory enabled
        MemoryManager->>Database: Query conversation messages
        Database-->>MemoryManager: Message history
        MemoryManager-->>Agent: ConversationHistory
    else In-memory only
        MemoryManager-->>Agent: Empty or cached history
    end
    
    Agent->>SystemPromptBuilder: buildSystemPrompt()
    Note over SystemPromptBuilder: Builds prompt from:<br/>- Identity<br/>- Personality<br/>- Knowledge<br/>- Goals<br/>- Memory context
    SystemPromptBuilder-->>Agent: Complete system prompt
    
    Agent->>ToolRegistry: listAvailable('text')
    ToolRegistry-->>Agent: Available tools list
    
    Agent->>AIProvider: chat({conversationHistory, systemPrompt, availableTools})
    
    AIProvider->>OpenAI API: Chat completion request
    OpenAI API-->>AIProvider: AI response (with optional tool calls)
    
    alt Tool calls requested
        AIProvider-->>Agent: Response with tool calls
        Agent->>ToolRegistry: execute(toolName, parameters, context)
        
        ToolRegistry->>Tool: Execute tool handler
        Tool-->>ToolRegistry: ToolResult
        
        ToolRegistry-->>Agent: Tool execution results
        
        Agent->>AIProvider: chat({toolResults, conversationHistory})
        AIProvider->>OpenAI API: Follow-up request
        OpenAI API-->>AIProvider: Final response
        AIProvider-->>Agent: Final AI response
    else No tool calls
        AIProvider-->>Agent: AI response
    end
    
    Agent->>MemoryManager: saveMessage(userMessage, aiResponse)
    
    alt Long-term memory enabled
        MemoryManager->>Database: Store messages
        Database-->>MemoryManager: Success
    end
    
    Agent-->>AgentInstance: AgentResponse {content, metadata}
    AgentInstance-->>AIReceptionistService: Response {text, metadata}
```

---

## Tool Execution Flow

### Sequence Diagram: Custom Tool Execution

```mermaid
sequenceDiagram
    participant Agent
    participant ToolRegistry
    participant BookingTool
    participant LeadManagementTool
    participant PrismaService
    participant BookingHelperService
    participant Database

    Agent->>ToolRegistry: execute('book_meeting', params, context)
    
    Note over ToolRegistry: Validates parameters<br/>against JSONSchema
    
    ToolRegistry->>BookingTool: Execute tool handler
    
    BookingTool->>BookingTool: Extract userId, leadId from context.metadata
    
    BookingTool->>PrismaService: Find user and lead
    PrismaService->>Database: Query user & lead
    Database-->>PrismaService: User & lead data
    PrismaService-->>BookingTool: User & lead entities
    
    BookingTool->>BookingTool: Resolve timezone<br/>(lead > provided > user > default)
    
    BookingTool->>PrismaService: Create booking
    PrismaService->>Database: Insert booking record
    Database-->>PrismaService: Booking entity
    PrismaService-->>BookingTool: Booking created
    
    BookingTool->>BookingHelperService: createGohighlevelBlockSlot(booking)
    BookingHelperService->>GoHighLevel API: Create block slot
    GoHighLevel API-->>BookingHelperService: Success
    BookingHelperService-->>BookingTool: Block slot created
    
    BookingTool-->>ToolRegistry: ToolResult {success: true, data, response}
    
    ToolRegistry-->>Agent: Tool execution result
    
    Note over Agent: Synthesizes final response<br/>incorporating tool results
```

### Available Custom Tools

1. **book_meeting**
   - Books a calendar meeting/appointment
   - Creates booking in database
   - Creates GoHighLevel block slot
   - Parameters: `date`, `time`, `timezone`, `location`, `subject`, `participants`

2. **check_availability**
   - Checks calendar availability for a date/time range
   - Returns available and booked time slots
   - Parameters: `date`, `startTime`, `endTime`

3. **update_lead_details**
   - Updates lead information in database
   - Parameters: `field`, `value`

4. **update_conversation_state**
   - Updates conversation state/metadata
   - Parameters: `state`, `metadata`

---

## Webhook Flows

### Sequence Diagram: Voice Webhook (Twilio)

```mermaid
sequenceDiagram
    participant Twilio
    participant WebhookController
    participant WebhookSecurityMiddleware
    participant PrismaService
    participant AgentFactoryService
    participant AgentConfigService
    participant AgentInstance
    participant Database

    Twilio->>WebhookController: POST /ai-receptionist/webhooks/voice
    Note over WebhookController: Payload: {From, To, CallSid, etc.}
    
    WebhookController->>WebhookSecurityMiddleware: Process request
    WebhookSecurityMiddleware->>WebhookSecurityMiddleware: Validate IP/Basic Auth
    WebhookSecurityMiddleware-->>WebhookController: Request approved
    
    WebhookController->>PrismaService: findLeadByPhone(From)
    PrismaService->>Database: Query lead by phone number
    Database-->>PrismaService: Lead entity
    PrismaService-->>WebhookController: Lead found
    
    WebhookController->>AgentConfigService: getAgentConfig(userId, leadId)
    AgentConfigService-->>WebhookController: AgentInstanceConfig
    
    WebhookController->>AgentFactoryService: getOrCreateAgent(userId, leadId, config)
    AgentFactoryService-->>WebhookController: AgentInstance
    
    WebhookController->>AgentInstance: voice.handleWebhook({provider: 'twilio', payload})
    
    Note over AgentInstance: Processes voice webhook:<br/>1. Detects call status<br/>2. Generates TwiML response<br/>3. Handles user speech input<br/>4. Routes to appropriate handler
    
    AgentInstance-->>WebhookController: TwiML XML response
    
    WebhookController-->>Twilio: TwiML response (text/xml)
    Twilio->>Twilio: Execute TwiML instructions<br/>(Say, Gather, Record, etc.)
```

### Sequence Diagram: SMS Webhook (Twilio)

```mermaid
sequenceDiagram
    participant Twilio
    participant WebhookController
    participant PrismaService
    participant AgentInstance
    participant Database

    Twilio->>WebhookController: POST /ai-receptionist/webhooks/sms
    Note over WebhookController: Payload: {From, To, Body, MessageSid}
    
    WebhookController->>PrismaService: findLeadByPhone(From)
    PrismaService->>Database: Query lead by phone
    Database-->>PrismaService: Lead entity
    PrismaService-->>WebhookController: Lead found
    
    WebhookController->>AgentInstance: sms.handleWebhook({provider: 'twilio', payload})
    
    Note over AgentInstance: Processes SMS:<br/>1. Extracts message body<br/>2. Processes through agent<br/>3. Generates response<br/>4. Sends reply via Twilio
    
    AgentInstance-->>WebhookController: TwiML response
    
    WebhookController-->>Twilio: TwiML with <Message> tag
    Twilio->>User: Send SMS reply
```

### Sequence Diagram: Email Webhook (Postmark)

```mermaid
sequenceDiagram
    participant Postmark
    participant WebhookController
    participant WebhookSecurityMiddleware
    participant PrismaService
    participant AgentInstance
    participant Database

    Postmark->>WebhookController: POST /ai-receptionist/webhooks/email
    Note over WebhookController: Payload: {From, To, Subject, TextBody, HtmlBody}
    
    WebhookController->>WebhookSecurityMiddleware: Process request
    WebhookSecurityMiddleware->>WebhookSecurityMiddleware: Validate IP whitelist<br/>(Postmark IPs)
    WebhookSecurityMiddleware-->>WebhookController: Request approved
    
    WebhookController->>PrismaService: findLeadByEmail(From)
    PrismaService->>Database: Query lead by email
    Database-->>PrismaService: Lead entity
    PrismaService-->>WebhookController: Lead found
    
    WebhookController->>AgentInstance: email.handleWebhook({provider: 'postmark', payload}, {autoReply: true})
    
    Note over AgentInstance: Processes email:<br/>1. Extracts email content<br/>2. Processes through agent<br/>3. Generates email response<br/>4. Sends reply via Postmark
    
    AgentInstance-->>WebhookController: Email response result
    
    WebhookController-->>Postmark: Success response
    Postmark->>User: Deliver email reply
```

---

## Memory & History Management

### Sequence Diagram: Conversation History Loading

```mermaid
sequenceDiagram
    participant AIReceptionistService
    participant AgentInstance
    participant MemoryManager
    participant Database
    participant Lead Entity

    AIReceptionistService->>AIReceptionistService: loadConversationHistory(agent, leadId)
    
    AIReceptionistService->>Database: Find lead by leadId
    Database-->>AIReceptionistService: Lead with messageHistory JSON
    
    alt messageHistory exists
        AIReceptionistService->>AIReceptionistService: Parse JSON messageHistory
        
        loop For each message in history
            AIReceptionistService->>MemoryManager: Add message to memory
            Note over MemoryManager: Stores in:<br/>- Short-term memory (context window)<br/>- Long-term memory (database)
        end
        
        MemoryManager->>Database: Store messages in conversation_messages table
        Database-->>MemoryManager: Success
    else No history
        AIReceptionistService->>MemoryManager: Initialize empty conversation
        MemoryManager-->>AIReceptionistService: Empty conversation ready
    end
```

### Sequence Diagram: Saving Messages

```mermaid
sequenceDiagram
    participant AIReceptionistService
    participant Database
    participant Lead Entity
    participant MemoryManager

    AIReceptionistService->>AIReceptionistService: saveMessageToHistory(leadId, userMessage, aiMessage)
    
    AIReceptionistService->>Database: Find lead by leadId
    Database-->>AIReceptionistService: Lead with current messageHistory
    
    AIReceptionistService->>AIReceptionistService: Parse existing messageHistory JSON
    
    AIReceptionistService->>AIReceptionistService: Append new messages:<br/>[{role: 'user', content, timestamp},<br/> {role: 'assistant', content, timestamp}]
    
    AIReceptionistService->>Database: Update lead
    Note over Database: Updates:<br/>- messageHistory (JSON string)<br/>- lastMessage<br/>- lastMessageDate
    
    Database-->>AIReceptionistService: Success
    
    par Also save to AI-receptionist memory
        AIReceptionistService->>MemoryManager: saveMessage(userMessage, aiMessage)
        MemoryManager->>Database: Store in conversation_messages table
        Database-->>MemoryManager: Success
    end
```

---

## Key Design Decisions

### 1. Factory Pattern for Agent Management
- **Why**: Efficient resource utilization - expensive resources (providers, storage, tools) are initialized once
- **Benefit**: Fast agent creation (~50ms) with low memory footprint (~5KB per agent)
- **Implementation**: `AgentFactoryService` manages a cache of agent instances

### 2. Dual-Write for Message History
- **Why**: Backward compatibility with existing `messageHistory` JSON field
- **Benefit**: Existing code continues to work while migrating to AI-receptionist memory system
- **Implementation**: Messages are saved to both `lead.messageHistory` (JSON) and `conversation_messages` table

### 3. Per-User/Lead Agent Configuration
- **Why**: Each user/lead combination may have different strategies and prompt templates
- **Benefit**: Personalized AI behavior based on user's business context
- **Implementation**: `AgentConfigService` builds configuration dynamically from database entities

### 4. Tool Registration at Factory Level
- **Why**: Tools are stateless and can be shared across all agent instances
- **Benefit**: Consistent tool availability and reduced memory usage
- **Implementation**: Tools registered once during factory initialization

### 5. Agent Instance Caching
- **Why**: Avoid recreating agents for every request
- **Benefit**: Faster response times and reduced initialization overhead
- **Implementation**: `AgentFactoryService` caches agents by `userId-leadId` key with 30-minute timeout

---

## Error Handling

### Common Error Scenarios

1. **Lead Not Found**
   - Returns `404 NotFoundException`
   - Logged for monitoring

2. **Agent Factory Not Initialized**
   - Throws error during agent creation
   - Should not happen in production (factory initializes on module init)

3. **AI Provider Errors**
   - Caught and logged
   - May return fallback response or error message

4. **Tool Execution Failures**
   - Tool errors are caught and logged
   - Agent continues processing without tool result
   - User receives error message in response

5. **Database Errors**
   - Transaction rollback if applicable
   - Error logged and propagated
   - User receives appropriate error response

---

## Performance Considerations

1. **Agent Caching**: Reduces agent creation overhead for active conversations
2. **Parallel Entity Fetching**: User, lead, and prompt template fetched in parallel
3. **Lazy Memory Loading**: Conversation history loaded only when needed
4. **Factory Pattern**: Shared resources reduce memory footprint
5. **Database Indexing**: Ensure indexes on `lead.id`, `lead.phone`, `lead.email` for fast lookups

---

## Future Enhancements

1. **Tool Registration Per-Agent**: Allow dynamic tool registration per agent instance
2. **Advanced Memory Management**: Implement conversation summarization for long conversations
3. **Multi-Channel Support**: Enhanced voice, SMS, and email capabilities
4. **Real-time Updates**: WebSocket support for real-time conversation updates
5. **Analytics Integration**: Track conversation metrics and agent performance

---

## Related Documentation

- [AI Migration Plan](./AI_MIGRATION_PLAN.md) - Complete migration documentation
- [AI-Receptionist SDK Documentation](../services/AI-receptionist/README.md) - SDK reference
- [API Documentation](./API_DOCUMENTATION.md) - API endpoint documentation (if exists)

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0.0

