# Migration Plan: @atchonk/ai-receptionist → Vercel AI SDK

## Executive Summary

This document outlines a comprehensive migration plan from the custom `@atchonk/ai-receptionist` package (v0.1.22) to Vercel's AI SDK (`ai` package). The migration will modernize the AI infrastructure, improve maintainability, and leverage Vercel's robust tooling ecosystem.

**Current Package**: `@atchonk/ai-receptionist` v0.1.22  
**Target Package**: Vercel AI SDK (`ai` + `@ai-sdk/openai`)  
**Migration Strategy**: Direct replacement - remove old package and implement new SDK  
**Estimated Timeline**: 4-6 weeks

## Quick Reference

### Key Migration Points

| Component | Current | Target | Complexity |
|-----------|---------|-------|------------|
| Text Generation | `agent.text.generate()` | `generateText()` / `streamText()` | Low |
| Tools | `ToolBuilder` class | `tool()` function with Zod | Medium |
| Streaming | Simulated (frontend) | True server-side streaming | Medium |
| Memory | Built-in SDK memory | Custom conversation service | High |
| Webhooks | SDK webhook handlers | Custom implementation | High |
| Agent Factory | SDK factory pattern | Config-based (no factory) | Low |

### Critical Dependencies to Install

```bash
# Backend
cd backend-api
pnpm add ai @ai-sdk/openai zod

# Frontend (for streaming support)
cd ../frontend
pnpm add ai
```

**Note**: Frontend needs `ai` package for `useChat` hook to handle true server-side streaming.

### Migration Phases

1. **Week 1**: Foundation (services, conversation history)
2. **Week 2**: Core text generation (direct replacement)
3. **Week 3**: Tool calling
4. **Week 4**: Agent factory & webhooks
5. **Week 5**: Frontend integration (if streaming is added)
6. **Week 6**: Cleanup & remove old package

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Vercel AI SDK Research & Capabilities](#2-vercel-ai-sdk-research--capabilities)
3. [Feature Mapping & Gap Analysis](#3-feature-mapping--gap-analysis)
4. [Migration Strategy](#4-migration-strategy)
5. [Detailed Migration Steps](#5-detailed-migration-steps)
6. [Code Examples & Patterns](#6-code-examples--patterns)
7. [Testing Strategy](#7-testing-strategy)
8. [Risk Assessment & Mitigation](#8-risk-assessment--mitigation)
9. [Rollback Plan](#9-rollback-plan)
10. [Timeline & Milestones](#10-timeline--milestones)
11. [Post-Migration Checklist](#11-post-migration-checklist)

---

## 1. Current State Analysis

### 1.1 Current Package Features

The `@atchonk/ai-receptionist` package provides:

#### Core Features
- **Agent Factory Pattern**: `AIReceptionistFactory.create()` for creating agent instances
- **Agent Instances**: Per-user/lead agent instances with caching (30-minute timeout)
- **Text Generation**: `agent.text.generate({ prompt, conversationId, metadata })`
- **Multi-Channel Support**: Voice (Twilio), SMS (Twilio), Email (Postmark) webhooks
- **Memory Management**: Conversation history with database persistence
- **Custom Tools**: ToolBuilder pattern for function calling
- **System Prompt Building**: Dynamic prompt construction from strategy/prompt templates
- **Provider Abstraction**: OpenAI integration with configurable models

#### Current Architecture

```
AIReceptionistService
├── AgentFactoryService (manages agent instances)
│   ├── Factory initialization with config
│   ├── Agent caching (userId-leadId key)
│   └── Tool registration at factory level
├── AgentConfigService (builds agent configs)
│   ├── Maps database entities to agent config
│   └── System prompt composition
├── Custom Tools
│   ├── BookingTools (book_meeting, check_availability)
│   └── LeadManagementTools (update_lead_details, update_conversation_state)
└── WebhookController (voice/SMS/email handlers)
```

#### Current Streaming Implementation

**Important Note**: The current frontend uses **simulated streaming** (word-by-word animation) rather than true server-side streaming:

- **Backend**: Returns complete response in single API call
- **Frontend**: `ChatInterface` component simulates streaming by animating words with delays (80ms per word)
- **Pattern**: `startStreamingMessage()` method splits response into words and displays them incrementally

**Migration Opportunity**: Vercel AI SDK's `streamText()` enables **true server-side streaming**, which will provide:
- Real-time response generation
- Better user experience (no artificial delays)
- Lower perceived latency
- Support for streaming tool results

#### Key Files to Migrate

**Backend Services:**
- `backend-api/src/main-app/modules/ai-receptionist/ai-receptionist.service.ts`
- `backend-api/src/main-app/modules/ai-receptionist/agent-factory.service.ts`
- `backend-api/src/main-app/modules/ai-receptionist/config/agent-config.service.ts`
- `backend-api/src/main-app/modules/ai-receptionist/custom-tools/booking-tools.ts`
- `backend-api/src/main-app/modules/ai-receptionist/custom-tools/lead-management-tools.ts`
- `backend-api/src/main-app/modules/ai-receptionist/webhook.controller.ts`
- `backend-api/src/main-app/modules/chat/chat.service.ts` (uses AIReceptionistService)

**Frontend:**
- `frontend/app/admin/(main)/chat/page.tsx` (chat UI)
- `frontend/components/chat/chat-interface.tsx` (streaming UI)

#### Current Dependencies

```json
{
  "@atchonk/ai-receptionist": "^0.1.22",
  "openai": "^6.8.1",
  "drizzle-orm": "^0.44.7",
  "pg": "^8.16.3"
}
```

### 1.2 Current Data Flow

1. **Chat Message Flow**:
   ```
   User → ChatController → ChatService → AIReceptionistService
   → AgentFactoryService.getOrCreateAgent()
   → AgentConfigService.getAgentConfig()
   → agent.text.generate()
   → Save to messageHistory (JSON field)
   ```

2. **Webhook Flow** (Voice/SMS/Email):
   ```
   Twilio/Postmark → WebhookController → AgentFactoryService
   → agent.voice/sms/email.handleWebhook()
   → TwiML/Email response
   ```

3. **Tool Execution Flow**:
   ```
   AI Response → Tool Registry → Custom Tool Handler
   → PrismaService (database operations)
   → ToolResult → AI Response Synthesis
   ```

---

## 2. Vercel AI SDK Research & Capabilities

### 2.1 Core Packages

- **`ai`**: Core SDK with `generateText`, `streamText`, `generateObject`, tool calling
- **`@ai-sdk/openai`**: OpenAI provider adapter
- **`ai/react`**: React hooks (`useChat`, `useCompletion`, `useObject`)
- **`ai/svelte`**, **`ai/vue`**: Framework-specific hooks

### 2.2 Key Features

#### Text Generation
- `generateText()`: Non-streaming text generation
- `streamText()`: Streaming text with partial updates
- `generateObject()`: Structured output with Zod schemas

#### Tool Calling
- `tool()`: Define tools with Zod input schemas
- `ToolLoopAgent`: Multi-step agent with tool execution
- Built-in tool result handling and streaming

#### UI Integration
- `useChat()`: React hook for chat interfaces with streaming
- Automatic message state management
- Tool invocation UI support
- Custom metadata support

#### Provider Support
- Unified API across providers (OpenAI, Anthropic, Google, etc.)
- Vercel AI Gateway integration (optional)
- Model configuration abstraction

### 2.3 Architecture Differences

| Current (@atchonk/ai-receptionist) | Vercel AI SDK |
|-----------------------------------|---------------|
| Factory pattern with agent instances | Direct function calls or agent instances |
| `agent.text.generate()` | `generateText()` or `streamText()` |
| `ToolBuilder` class | `tool()` function with Zod schema |
| Built-in memory management | Manual conversation history management |
| Multi-channel webhooks (voice/SMS/email) | Text generation only (webhooks need custom implementation) |
| System prompt building in SDK | Manual system prompt construction |

### 2.4 Limitations & Considerations

**What Vercel AI SDK Doesn't Provide:**
- Voice/SMS/Email webhook handlers (need custom implementation)
- Built-in conversation memory persistence (need custom implementation)
- Agent factory pattern (can be implemented as wrapper)
- Multi-channel communication abstractions

**What We Need to Build:**
- Conversation history management service
- Webhook handlers for Twilio/Postmark
- Config builder service (builds config per request, no caching)
- System prompt builder service

---

## 3. Feature Mapping & Gap Analysis

### 3.1 Feature-by-Feature Mapping

| Current Feature | Vercel AI SDK Equivalent | Migration Complexity | Notes |
|----------------|-------------------------|---------------------|-------|
| **Text Generation** | `generateText()` / `streamText()` | Low | Direct replacement |
| **Streaming** | `streamText()` with `.toDataStreamResponse()` | Low | Better streaming support |
| **Tool Calling** | `tool()` with Zod schemas | Medium | Different API, need refactoring |
| **Agent Factory** | Config-based (no factory) | Low | Pass config directly to each call |
| **System Prompts** | Manual construction in `messages` array | Low | Similar to current approach |
| **Memory/History** | Custom service (no built-in) | High | Need to build conversation history service |
| **Voice Webhooks** | Custom implementation | High | No SDK support, need TwiML generation |
| **SMS Webhooks** | Custom implementation | High | No SDK support, need TwiML generation |
| **Email Webhooks** | Custom implementation | High | No SDK support, need email sending |
| **Multi-Channel** | Custom orchestration layer | High | Need to build abstraction layer |

### 3.2 Gap Analysis

#### Critical Gaps (Must Build)
1. **Conversation History Service**: Manage message history, context window, summarization
2. **Webhook Handlers**: Voice/SMS/Email webhook processing with AI integration
3. **Config Builder Service**: Builds AI config per request from database entities
4. **Multi-Channel Orchestration**: Unified interface for voice/SMS/email/chat

#### Nice-to-Have Enhancements
1. **Streaming UI**: Better streaming support with `useChat` hook
2. **Structured Output**: Use `generateObject()` for tool results
3. **Error Handling**: Improved error handling with SDK's error types
4. **Type Safety**: Better TypeScript types from SDK

---

## 4. Migration Strategy

**Approach**: Direct replacement - remove old package and implement Vercel AI SDK. No feature flags or gradual rollout - complete migration in one go after thorough testing.

**Key Design Decision**: **Config-Based Approach** (not agent factory pattern)
- For each request, build config from database (strategy, prompt template, etc.)
- Pass config directly to `streamText()` or `generateText()`
- No agent instances, no caching - stateless and simpler
- Memory (conversation history) passed per request
- Tools built per request with userId/leadId in closure

### 4.1 Direct Replacement Strategy

**Phase 1: Foundation** (Week 1)
- Install Vercel AI SDK packages
- Create conversation history service
- Create system prompt builder service
- Set up new service structure

**Phase 2: Core Text Generation** (Week 2)
- Replace `generateTextResponse()` with Vercel SDK implementation
- Update `ChatService` to use new service
- Remove old `@atchonk/ai-receptionist` usage
- Test thoroughly

**Phase 3: Tool Calling** (Week 3)
- Migrate custom tools to `tool()` API
- Update tool execution flow
- Test tool invocation end-to-end

**Phase 4: Config Builder Service** (Week 3-4)
- Build config builder service (no factory pattern, stateless)
- Migrate agent configuration service to build config per request
- Remove agent factory and caching (config-based approach)
- Build tools per request with userId/leadId in closure

**Phase 5: Webhooks** (Week 4-5)
- Migrate voice webhook handler (custom implementation)
- Migrate SMS webhook handler (custom implementation)
- Migrate email webhook handler (custom implementation)

**Phase 6: Frontend Streaming** (Week 5)
- Update backend to return streaming responses
- Update frontend to handle true server-side streaming
- Replace simulated streaming with real streaming
- Test streaming end-to-end

**Phase 7: Cleanup** (Week 6)
- Remove `@atchonk/ai-receptionist` package
- Remove all old code references
- Update documentation
- Performance optimization

---

## 5. Detailed Migration Steps

### Step 1: Install Dependencies

```bash
# Backend only - frontend doesn't need AI SDK
cd backend-api
pnpm add ai @ai-sdk/openai zod
pnpm add -D @types/node
```

**Note**: Frontend doesn't need the `ai` package. The current frontend makes API calls to the backend and will continue to work without changes.

### Step 2: Create Conversation History Service

**File**: `backend-api/src/main-app/modules/ai-receptionist/services/conversation-history.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { CoreMessage } from 'ai';

@Injectable()
export class ConversationHistoryService {
  constructor(private prisma: PrismaService) {}

  async getHistory(leadId: number, maxMessages: number = 20): Promise<CoreMessage[]> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { messageHistory: true },
    });

    if (!lead?.messageHistory) {
      return [];
    }

    const history = JSON.parse(lead.messageHistory as string);
    const recentHistory = history.slice(-maxMessages);

    return recentHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  async saveMessage(leadId: number, role: 'user' | 'assistant', content: string): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { messageHistory: true },
    });

    const existingHistory = lead?.messageHistory
      ? JSON.parse(lead.messageHistory as string)
      : [];

    const newMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...existingHistory, newMessage];

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        messageHistory: JSON.stringify(updatedHistory),
        lastMessage: content,
        lastMessageDate: new Date(),
      },
    });
  }
}
```

### Step 3: Create System Prompt Builder Service

**File**: `backend-api/src/main-app/modules/ai-receptionist/services/system-prompt-builder.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import type { AgentInstanceConfig } from '@atchonk/ai-receptionist';
import { AgentConfigMapper } from '../mappers/agent-config.mapper';

@Injectable()
export class SystemPromptBuilderService {
  constructor(private mapper: AgentConfigMapper) {}

  buildSystemPrompt(config: AgentInstanceConfig): string {
    const { identity, personality, knowledge, goals } = config;

    const parts: string[] = [];

    // Identity
    if (identity.name) parts.push(`You are ${identity.name}`);
    if (identity.role) parts.push(`Your role is ${identity.role}`);
    if (identity.backstory) parts.push(`Background: ${identity.backstory}`);

    // Personality
    if (personality.traits) {
      parts.push(`Personality traits: ${personality.traits.join(', ')}`);
    }
    if (personality.communicationStyle) {
      parts.push(`Communication style: ${personality.communicationStyle}`);
    }

    // Knowledge
    if (knowledge.domain) parts.push(`Domain expertise: ${knowledge.domain}`);
    if (knowledge.expertise) {
      parts.push(`Expertise areas: ${knowledge.expertise.join(', ')}`);
    }

    // Goals
    if (goals.primary) parts.push(`Primary goal: ${goals.primary}`);
    if (goals.secondary && goals.secondary.length > 0) {
      parts.push(`Secondary goals: ${goals.secondary.join(', ')}`);
    }

    return parts.join('\n\n');
  }
}
```

### Step 4: Migrate Text Generation (Config-Based with Streaming)

**File**: `backend-api/src/main-app/modules/ai-receptionist/services/vercel-ai.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConversationHistoryService } from './conversation-history.service';
import { SystemPromptBuilderService } from './system-prompt-builder.service';
import { AgentConfigService } from '../config/agent-config.service';
import type { CoreMessage } from 'ai';

interface AIConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools?: Record<string, any>;
}

@Injectable()
export class VercelAIService {
  private readonly logger = new Logger(VercelAIService.name);

  constructor(
    private prisma: PrismaService,
    private conversationHistory: ConversationHistoryService,
    private systemPromptBuilder: SystemPromptBuilderService,
    private agentConfig: AgentConfigService,
  ) {}

  /**
   * Generate streaming text response
   * Config-based approach: builds config per request, no agent instances
   */
  async streamTextResponse(
    leadId: number,
    message: string,
    userId: number,
    imageData?: Array<{ imageBase64: string; imageName?: string; imageType?: string }>,
  ): Promise<ReadableStream> {
    // Build config for this request
    const config = await this.buildConfig(userId, leadId);

    // Get conversation history (memory)
    const history = await this.conversationHistory.getHistory(
      leadId,
      config.contextWindow || 20,
    );

    // Build messages array
    const messages: CoreMessage[] = [
      { role: 'system', content: config.systemPrompt },
      ...history,
      // Handle image data if present
      ...(imageData && imageData.length > 0
        ? [
            {
              role: 'user' as const,
              content: [
                { type: 'text' as const, text: message },
                ...imageData.map((img) => ({
                  type: 'image' as const,
                  image: img.imageBase64,
                })),
              ],
            },
          ]
        : [{ role: 'user' as const, content: message }]),
    ];

    // Configure model
    const model = openai(config.model, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    // Stream text with tools
    const result = streamText({
      model,
      messages,
      tools: config.tools,
      maxSteps: 5, // Allow tool calling
    });

    // Save user message to history (assistant message saved after streaming completes)
    await this.conversationHistory.saveMessage(leadId, 'user', message);

    // Return streaming response
    return result.toDataStreamResponse();
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
    const systemPrompt = this.systemPromptBuilder.buildSystemPrompt(agentConfig);

    // Build tools for this request (pass userId and leadId to tools)
    const tools = await this.buildTools(userId, leadId, agentConfig);

    return {
      systemPrompt,
      model: modelConfig.model || 'gpt-4o-mini',
      temperature: modelConfig.temperature ?? 0.7,
      maxTokens: modelConfig.maxTokens ?? 500,
      tools,
      contextWindow: agentConfig.memory?.contextWindow || 20,
    };
  }

  /**
   * Build tools for this request
   */
  private async buildTools(
    userId: number,
    leadId: number,
    agentConfig: any,
  ): Promise<Record<string, any>> {
    // Get lead for timezone
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { timezone: true },
    });

    // Build tools with userId and leadId in closure
    // Tools will be defined in separate service
    return {
      book_meeting: this.bookingTools.createBookMeetingTool(
        userId,
        leadId,
        lead?.timezone,
      ),
      check_availability: this.bookingTools.createCheckAvailabilityTool(userId),
      update_lead_details: this.leadManagementTools.createUpdateLeadDetailsTool(leadId),
      update_conversation_state: this.leadManagementTools.createUpdateConversationStateTool(
        leadId,
      ),
    };
  }
}
```

### Step 5: Migrate Custom Tools

**File**: `backend-api/src/main-app/modules/ai-receptionist/tools/booking-tools-vercel.ts`

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { BookingHelperService } from '../../bookings/booking-helper.service';

@Injectable()
export class BookingToolsVercel {
  constructor(
    private prisma: PrismaService,
    private bookingHelper: BookingHelperService,
  ) {}

  createBookMeetingTool(userId: number, leadId: number, leadTimezone?: string) {
    return tool({
      description: leadTimezone
        ? `Book a calendar meeting/appointment. Lead's timezone is ${leadTimezone}.`
        : 'Book a calendar meeting/appointment. ALWAYS confirm timezone with the lead before booking.',
      parameters: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
        timezone: z.string().regex(/^[A-Za-z_]+/[A-Za-z_]+$/).optional(),
        location: z.string(),
        subject: z.string(),
        participants: z.array(z.string().email()).default([]),
      }),
      execute: async ({ date, time, timezone, location, subject, participants }) => {
        // Implementation similar to current booking-tools.ts
        // Extract userId and leadId from closure
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { bookingEnabled: true, subAccountId: true, timezone: true },
        });

        if (!user || !user.bookingEnabled) {
          return {
            success: false,
            error: 'Booking is not enabled for this user',
            message: "I'm sorry, booking is not enabled for this account.",
          };
        }

        const resolvedTimezone = leadTimezone || timezone || user.timezone || 'America/New_York';

        const booking = await this.prisma.booking.create({
          data: {
            regularUser: { connect: { id: userId } },
            lead: { connect: { id: leadId } },
            bookingType: 'meeting',
            details: { date, time, location, subject, participants },
            status: 'pending',
            subAccount: { connect: { id: user.subAccountId } },
          },
        });

        return {
          success: true,
          bookingId: booking.id,
          message: `Perfect! I've booked your meeting for ${date} at ${time}.`,
        };
      },
    });
  }

  createCheckAvailabilityTool(userId: number) {
    return tool({
      description: 'Check calendar availability for a specific date and time range',
      parameters: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).default('17:00'),
      }),
      execute: async ({ date, startTime, endTime }) => {
        // Implementation similar to current booking-tools.ts
        const bookings = await this.prisma.booking.findMany({
          where: {
            regularUserId: userId,
            details: {
              path: ['date'],
              equals: date,
            },
          },
        });

        // Generate available slots logic...
        const availableSlots: string[] = [];
        // ... (similar to current implementation)

        return {
          date,
          availableSlots,
          message: `Here are the available time slots for ${date}: ${availableSlots.join(', ')}`,
        };
      },
    });
  }
}
```

### Step 6: Replace AIReceptionistService Implementation

**File**: `backend-api/src/main-app/modules/ai-receptionist/ai-receptionist.service.ts`

```typescript
// Replace the entire implementation to use VercelAIService
// Remove all @atchonk/ai-receptionist imports and usage

import { VercelAIService } from './services/vercel-ai.service';

@Injectable()
export class AIReceptionistService {
  constructor(private vercelAIService: VercelAIService) {}

  async generateTextResponse(request: GenerateTextRequestDto): Promise<string> {
    return this.vercelAIService.generateTextResponse(
      request.leadId,
      request.message,
      request.context?.userId || lead.regularUserId,
    );
  }

  // ... other methods delegate to VercelAIService
}
```

### Step 7: Frontend Streaming Implementation

**Current Implementation**: Frontend uses simulated streaming (word-by-word animation)  
**Target**: True server-side streaming with Vercel AI SDK

#### Backend: Update Chat Controller to Support Streaming

**File**: `backend-api/src/main-app/modules/chat/chat.controller.ts`

```typescript
@Post('send')
async sendMessage(
  @Body() chatMessageDto: ChatMessageDto,
  @Res() res: Response,
) {
  const { leadId, content } = chatMessageDto;

  // Get streaming response
  const stream = await this.aiReceptionistService.streamTextResponse(
    leadId,
    content,
    userId,
    imageData,
  );

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Pipe stream to response
  return stream.pipeTo(
    new WritableStream({
      write(chunk) {
        res.write(chunk);
      },
      close() {
        res.end();
      },
    }),
  );
}
```

#### Frontend: Handle Streaming Response

**Option 1: Use `ai` package with `useChat` hook**

**File**: `frontend/app/admin/(main)/chat/page.tsx`

```typescript
import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/proxy/chat/send',
    body: {
      leadId: selectedLeadId,
    },
    streamProtocol: 'data',
    onFinish: async (message) => {
      // Save completed message to backend
      await api.chat.saveMessage({
        leadId: selectedLeadId,
        content: message.content,
        role: 'assistant',
      });
    },
  });

  // Render messages from useChat
  return (
    <ChatInterface
      messages={messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(),
      }))}
      onSendMessage={handleSubmit}
      isStreaming={isLoading}
    />
  );
}
```

**Option 2: Manual streaming with fetch**

**File**: `frontend/app/admin/(main)/chat/page.tsx`

```typescript
const handleSendMessage = async (message: string) => {
  // Add user message
  setMessages((prev) => [...prev, { role: 'user', content: message }]);

  // Create AI message placeholder
  const aiMessageId = `ai-${Date.now()}`;
  setMessages((prev) => [...prev, { id: aiMessageId, role: 'assistant', content: '' }]);

  try {
    const response = await fetch('/api/proxy/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selectedLeadId, content: message }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('0:')) {
          // Text chunk
          const text = line.slice(2);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: msg.content + text }
                : msg,
            ),
          );
        }
      }
    }
  } catch (error) {
    logger.error('Streaming error:', error);
  }
};
```

**Install frontend package**:

```bash
cd frontend
pnpm add ai
```

---

## 6. Code Examples & Patterns

### 6.1 Basic Text Generation

**Before** (@atchonk/ai-receptionist):
```typescript
const response = await agent.text.generate({
  prompt: message,
  conversationId: `lead-${leadId}`,
  metadata: { leadId, userId },
});
return response.text;
```

**After** (Vercel AI SDK):
```typescript
const result = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ],
});
return result.text;
```

### 6.2 Streaming Response

**Before**:
```typescript
// No built-in streaming in current package
```

**After**:
```typescript
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages,
});

return result.toDataStreamResponse();
```

### 6.3 Tool Calling

**Before**:
```typescript
const tool = new ToolBuilder()
  .withName('book_meeting')
  .withParameters({ type: 'object', properties: {...} })
  .default(async (params, ctx) => { ... })
  .build();
```

**After**:
```typescript
const tool = tool({
  description: 'Book a meeting',
  parameters: z.object({
    date: z.string(),
    time: z.string(),
    // ...
  }),
  execute: async ({ date, time }) => {
    // ...
  },
});
```

### 6.4 Config-Based Approach (No Factory)

**Before** (Agent Factory Pattern):
```typescript
const agent = await this.agentFactory.getOrCreateAgent(userId, leadId, config);
const response = await agent.text.generate({ prompt, conversationId, metadata });
```

**After** (Config-Based, Stateless):
```typescript
// Build config per request
const config = await this.buildConfig(userId, leadId);
const history = await this.conversationHistory.getHistory(leadId);

const result = streamText({
  model: openai(config.model),
  messages: [
    { role: 'system', content: config.systemPrompt },
    ...history,
    { role: 'user', content: message },
  ],
  tools: config.tools,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
});

// No agent instances, no caching - stateless approach
return result.toDataStreamResponse();
```

**Benefits**:
- Simpler code (no factory, no caching)
- Always fresh config (no stale agent instances)
- Stateless (easier to scale)
- Aligns with Vercel AI SDK's design

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Test Text Generation**:
```typescript
describe('VercelAIService', () => {
  it('should generate text response', async () => {
    const response = await service.generateTextResponse(leadId, 'Hello', userId);
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });
});
```

**Test Tool Execution**:
```typescript
describe('BookingToolsVercel', () => {
  it('should book a meeting', async () => {
    const tool = bookingTools.createBookMeetingTool(userId, leadId);
    const result = await tool.execute({ date: '2025-01-15', time: '14:00', ... });
    expect(result.success).toBe(true);
  });
});
```

### 7.2 Integration Tests

**Test Chat Flow**:
```typescript
describe('Chat Integration', () => {
  it('should handle full chat conversation', async () => {
    // Send message
    const response = await chatService.sendMessage({ leadId, content: 'Hello' });
    expect(response.aiMessage).toBeDefined();
    
    // Verify history saved
    const history = await conversationHistory.getHistory(leadId);
    expect(history.length).toBeGreaterThan(0);
  });
});
```

### 7.3 E2E Tests

**Test End-to-End Chat**:
```typescript
describe('E2E Chat Flow', () => {
  it('should complete full chat conversation with tool calling', async () => {
    // 1. Send initial message
    // 2. Receive AI response
    // 3. Send message requesting booking
    // 4. Verify tool executed
    // 5. Verify booking created
    // 6. Verify AI response includes booking confirmation
  });
});
```

### 7.4 Comparison Tests

**Test Feature Parity**:
```typescript
describe('Migration Parity', () => {
  it('should produce similar responses', async () => {
    const oldResponse = await oldService.generateTextResponse(...);
    const newResponse = await newService.generateTextResponse(...);
    
    // Compare response quality, length, etc.
    expect(newResponse.length).toBeGreaterThan(0);
  });
});
```

---

## 8. Risk Assessment & Mitigation

### 8.1 High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Response Quality Differences** | High | Medium | A/B testing, response comparison, gradual rollout |
| **Tool Execution Failures** | High | Low | Comprehensive testing, error handling, fallback logic |
| **Memory/History Loss** | High | Low | Dual-write during migration, backup before migration |
| **Webhook Handler Issues** | High | Medium | Extensive webhook testing, Twilio/Postmark sandbox |
| **Performance Degradation** | Medium | Low | Performance benchmarking, caching optimization |
| **Breaking Changes in SDK** | Medium | Low | Pin SDK version, monitor updates, test before upgrading |

### 8.2 Mitigation Strategies

1. **Comprehensive Testing**: Extensive unit, integration, and E2E tests before deployment
2. **Staging Environment**: Test thoroughly in staging before production
3. **Monitoring**: Comprehensive logging and error tracking
4. **Backup**: Database backups before migration
5. **Documentation**: Clear procedures and code comments
6. **Code Review**: Thorough review of all changes

---

## 9. Rollback Plan

### 9.1 Rollback Triggers

- Response quality degradation (>20% user complaints)
- Error rate increase (>5% of requests)
- Performance degradation (>2x latency)
- Critical bugs in production

### 9.2 Rollback Procedure

1. **Immediate**: Revert to previous git commit or branch
2. **Deploy**: Rollback deployment to previous version
3. **Verify**: Check that system is working correctly
4. **Monitor**: Watch error rates and user feedback
5. **Investigate**: Root cause analysis of issues
6. **Fix**: Address issues in new implementation
7. **Retry**: Deploy fixed version after testing

### 9.3 Rollback Checklist

- [ ] Environment variable updated
- [ ] Old implementation verified working
- [ ] Monitoring dashboards checked
- [ ] Team notified
- [ ] Issue logged and prioritized
- [ ] Fix plan created

---

## 10. Timeline & Milestones

### Week 1: Foundation
- [ ] Install Vercel AI SDK packages (backend + frontend)
- [ ] Create conversation history service
- [ ] Create system prompt builder service
- [ ] Create config builder service (builds config per request)
- [ ] Create VercelAIService structure
- [ ] Write initial tests

### Week 2: Core Text Generation & Streaming
- [ ] Replace `generateTextResponse()` with `streamTextResponse()` using Vercel SDK
- [ ] Implement config-based approach (no agent factory)
- [ ] Update `ChatService` and `ChatController` to support streaming
- [ ] Remove old `@atchonk/ai-receptionist` usage from AIReceptionistService
- [ ] Comprehensive testing
- [ ] Performance benchmarking

### Week 3: Tool Calling
- [ ] Migrate booking tools to `tool()` API
- [ ] Migrate lead management tools
- [ ] Update tool execution flow
- [ ] Test tool invocation end-to-end

### Week 4: Agent Factory & Webhooks
- [ ] Build agent factory wrapper
- [ ] Implement agent caching
- [ ] Migrate voice webhook handler
- [ ] Migrate SMS webhook handler
- [ ] Migrate email webhook handler

### Week 5: Frontend Streaming Integration
- [ ] Update frontend to use `useChat` hook or manual streaming
- [ ] Replace simulated streaming with true server-side streaming
- [ ] Test streaming with tool calls
- [ ] End-to-end testing of streaming chat flow
- [ ] User acceptance testing

### Week 6: Cleanup & Optimization
- [ ] Remove `@atchonk/ai-receptionist` package from package.json
- [ ] Remove all old code references
- [ ] Clean up unused imports and dependencies
- [ ] Update documentation
- [ ] Performance optimization
- [ ] Final testing and validation

---

## 11. Post-Migration Checklist

### Code Cleanup
- [ ] Remove `@atchonk/ai-receptionist` package from package.json
- [ ] Run `pnpm remove @atchonk/ai-receptionist`
- [ ] Remove unused imports and dependencies
- [ ] Delete old service files (after verification)
- [ ] Update TypeScript types
- [ ] Remove all references to old package

### Documentation
- [ ] Update API documentation
- [ ] Update developer onboarding docs
- [ ] Update architecture diagrams
- [ ] Create migration guide for future reference
- [ ] Update README files

### Monitoring & Optimization
- [ ] Set up monitoring dashboards
- [ ] Configure alerts for errors
- [ ] Performance optimization
- [ ] Cost analysis (compare old vs new)
- [ ] User feedback collection

### Team Training
- [ ] Team training on new SDK
- [ ] Code review guidelines updated
- [ ] Best practices documentation
- [ ] Troubleshooting guide

---

## 12. Additional Resources

### Vercel AI SDK Documentation
- [Official Docs](https://sdk.vercel.ai/docs)
- [GitHub Repository](https://github.com/vercel/ai)
- [Migration Guide](https://sdk.vercel.ai/docs/migration)

### Key Files Reference
- Current Implementation: `backend-api/src/main-app/modules/ai-receptionist/`
- Migration Target: `backend-api/src/main-app/modules/ai-receptionist/vercel/`
- Frontend Chat: `frontend/app/admin/(main)/chat/page.tsx`

### Support & Questions
- Vercel AI SDK Discord: [Link]
- GitHub Issues: [Link]
- Internal Team: [Contact Info]

---

## Appendix A: Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Vercel AI Gateway (Optional)
VERCEL_AI_GATEWAY_URL=https://...
VERCEL_AI_GATEWAY_KEY=...
```

## Appendix B: Package Versions

```json
{
  "ai": "^4.0.0",
  "@ai-sdk/openai": "^1.0.0",
  "zod": "^3.22.0"
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: Migration Team  
**Status**: Draft → In Progress → Complete
