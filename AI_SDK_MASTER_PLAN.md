# AI Receptionist SDK - Master Plan (80/20 Focused)

**Goal**: Add minimal, essential features to the SDK to support production sales agent use case while keeping the SDK generic and reusable.

**Principle**: 20% of work to achieve 80% of value. Focus on what's missing, not what's already there.

---

## ✅ What the SDK Already Has (Don't Duplicate)

### 1. **Memory & Summarization** ✅
- ✅ ShortTermMemory, LongTermMemory, VectorMemory
- ✅ MemoryManager with conversation tracking
- ✅ Session management (start/end conversation)
- ✅ **Already has conversation summarization via PromptOptimizer** (`compressChatHistory`)
  - Keeps last 5 messages intact
  - Compresses older messages into system message summary
  - Uses compression model for summarization

**Verdict**: ✅ **NO WORK NEEDED** - Conversation summarization already exists

---

### 2. **Prompt Building System** ✅
- ✅ SystemPromptBuilder with all 5 pillars (Identity, Personality, Knowledge, Memory, Goals)
- ✅ Priority-based section assembly
- ✅ Channel-specific communication guidelines
- ✅ Error handling sections
- ✅ Few-shot examples support
- ✅ PromptOptimizer for validation and token management

**Verdict**: ✅ **MOSTLY COMPLETE** - Just needs business context extension points (see below)

---

### 3. **Tool System** ✅
- ✅ ToolRegistry with registration/execution
- ✅ Channel-specific tool handlers
- ✅ Tool execution logging
- ✅ Standard tools: database, calendar, email, messaging, calls
- ✅ Agent directly executes tools from registry
- ✅ Multi-turn tool execution pattern

**Verdict**: ✅ **FULLY EXTENSIBLE** - Backend can register custom booking/lead tools easily

---

### 4. **Agent Core** ✅
- ✅ Agent orchestration (process method)
- ✅ Tool call execution with multi-turn support
- ✅ Memory storage integration
- ✅ Error handling with graceful degradation
- ✅ Observability (logging, tracing)

**Verdict**: ✅ **PRODUCTION READY** - No changes needed

---

## 🎯 What Needs to Be Added (Minimal Scope)

### **1. Security Input Validation** 🔒 (80/20 Priority)
**Problem**: SDK has no protection against jailbreak attempts or malicious inputs.

**Solution**: Minimal security middleware (20% effort, 80% protection)

#### What to Add:
```typescript
// src/agent/security/InputValidator.ts

export interface SecurityResult {
  isSecure: boolean;
  sanitizedContent: string;
  riskLevel: 'low' | 'medium' | 'high';
  detectedPatterns: string[];
}

export class InputValidator {
  /**
   * Quick pattern-based security check (80/20)
   * Catches most common jailbreak attempts without heavy ML
   */
  validate(input: string): SecurityResult {
    const patterns = [
      // Role override attempts
      /ignore.*previous.*instructions?/i,
      /you are now/i,
      /forget.*(?:instructions?|role|system)/i,
      /new instructions?:/i,
      /override.*system/i,

      // Prompt extraction attempts
      /(?:show|display|print|output).*(?:system prompt|instructions?)/i,
      /what (?:are|is) your (?:instructions?|prompt|rules)/i,

      // Character role-play exploits
      /pretend (?:to be|you are)/i,
      /act as (?:if|a)/i,
      /roleplay/i,

      // Delimiter confusion
      /```system/i,
      /\[SYSTEM\]/i,
      /\<\|im_start\|\>/i,

      // DAN-style attempts
      /Developer Mode/i,
      /DAN.*do anything/i,
      /jailbreak/i
    ];

    const detectedPatterns: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.source);
        riskLevel = 'high';
      }
    }

    // Simple sanitization: remove delimiter attempts
    const sanitized = input
      .replace(/```system/gi, '')
      .replace(/\[SYSTEM\]/gi, '')
      .replace(/\<\|im_start\|\>/gi, '')
      .trim();

    return {
      isSecure: detectedPatterns.length === 0,
      sanitizedContent: sanitized,
      riskLevel,
      detectedPatterns
    };
  }

  /**
   * Generate security response when jailbreak detected
   */
  getSecurityResponse(riskLevel: 'medium' | 'high'): string {
    if (riskLevel === 'high') {
      return "I'm here to help with legitimate questions. Please rephrase your request.";
    }
    return "I can't help with that. Let me know if you have other questions.";
  }
}
```

#### Integration Point:
```typescript
// In Agent.process() - add before execute()

// Validate input security
const securityCheck = this.inputValidator.validate(request.input);

if (!securityCheck.isSecure) {
  this.logger.warn('Security check failed', {
    detectedPatterns: securityCheck.detectedPatterns,
    riskLevel: securityCheck.riskLevel
  });

  if (securityCheck.riskLevel === 'high') {
    return {
      content: this.inputValidator.getSecurityResponse('high'),
      channel: request.channel,
      metadata: { securityBlock: true }
    };
  }
}

// Use sanitized content
const sanitizedRequest = { ...request, input: securityCheck.sanitizedContent };
```

**Effort**: ~2 hours
**Value**: Blocks 80% of jailbreak attempts with simple regex patterns

---

### **2. Business Context Extension API** 🔧 (Prompt Building)
**Problem**: SDK's SystemPromptBuilder is great but doesn't have a way to inject business-specific context (company info, lead info, booking availability).

**Solution**: Add context injection points to PromptContext

#### What to Add:
```typescript
// src/agent/types/index.ts - extend PromptContext

export interface PromptContext {
  identity: Identity;
  personality?: PersonalityEngine;
  knowledge?: KnowledgeBase;
  goals?: Goal[];
  channel?: Channel;
  examples?: PromptExample[];
  policies?: Array<{ name: string; rule: string }>;
  escalationRules?: string[];
  maxTokens?: number;

  // NEW: Business context injection points
  businessContext?: {
    companyInfo?: string;      // Format: "Company: Acme Inc\nOwner: John Doe\nEmail: ..."
    leadInfo?: string;          // Format: "Lead: Jane Smith\nEmail: jane@...\nPhone: ..."
    additionalContext?: string; // Any other contextual info (booking availability, etc.)
  };
}
```

#### Add to SystemPromptBuilder:
```typescript
// src/agent/prompt/SystemPromptBuilder.ts

private buildBusinessContextSection(businessContext: {
  companyInfo?: string;
  leadInfo?: string;
  additionalContext?: string;
}): PromptSection {
  let content = '# BUSINESS CONTEXT\n\n';

  if (businessContext.companyInfo) {
    content += `## Company Information\n${businessContext.companyInfo}\n\n`;
  }

  if (businessContext.leadInfo) {
    content += `## Current Lead\n${businessContext.leadInfo}\n\n`;
  }

  if (businessContext.additionalContext) {
    content += `## Additional Context\n${businessContext.additionalContext}\n\n`;
  }

  return {
    name: 'BUSINESS_CONTEXT',
    priority: 7,
    content: content.trim()
  };
}

// In build() method, add:
if (context.businessContext) {
  sections.push(this.buildBusinessContextSection(context.businessContext));
}
```

**Backend Usage**:
```typescript
// In backend's chat service:

const businessContext = {
  companyInfo: `Company: ${user.company}\nOwner: ${user.name}\nEmail: ${user.email}`,
  leadInfo: `Lead: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nStatus: ${lead.status}`,
  additionalContext: `Booking Availability:\n${formattedAvailability}`
};

// Pass to agent
const response = await agent.process({
  ...request,
  context: {
    ...request.context,
    businessContext
  }
});
```

**Effort**: ~1 hour
**Value**: Makes SDK flexible for any business use case without hardcoding sales logic

---

### **3. ~~Rate Limiting~~** ❌ **NOT SDK'S RESPONSIBILITY**
**Why**: Rate limiting is infrastructure/service provider concern, not AI SDK concern.

**Backend should handle this**:
- Use NestJS `@nestjs/throttler` for API-level rate limiting
- Use Redis-based rate limiting for distributed systems
- Use API Gateway (AWS, GCP, Azure) for enterprise-grade rate limiting
- Use middleware/guards at HTTP layer

**SDK should NOT**:
- Track request counts (not scalable, not stateless)
- Store user request history (memory bloat in long-running processes)
- Make infrastructure decisions for the consumer

**Verdict**: ❌ **REMOVED FROM SCOPE** - Backend handles this with proper infrastructure

---

## 📋 Implementation Checklist

### **Phase 1: Security** (Week 1 - 1 day)
- [ ] Create `src/agent/security/InputValidator.ts`
- [ ] Create `src/agent/security/index.ts` (exports)
- [ ] Add InputValidator to Agent constructor
- [ ] Integrate validation in `Agent.process()` (before execute)
- [ ] Add security config to AgentConfiguration interface
- [ ] Write unit tests for InputValidator
- [ ] Update Agent types exports

**Config Interface**:
```typescript
export interface AgentConfiguration {
  // ... existing fields
  security?: {
    inputValidation?: boolean; // default: true
  };
}
```

---

### **Phase 2: Business Context API** (Week 1 - 1 day)
- [ ] Extend `PromptContext` interface with `businessContext`
- [ ] Add `buildBusinessContextSection()` to SystemPromptBuilder
- [ ] Integrate business context section in `build()` method
- [ ] Update TypeScript exports
- [ ] Write example usage in documentation
- [ ] Write unit tests for business context prompt building

---

### **Phase 3: Backend Integration** (Week 2 - 2 days)
- [ ] Update backend to use SDK's Agent instead of custom orchestration
- [ ] Create backend's custom booking tools (register with ToolRegistry)
- [ ] Create backend's lead management tools (register with ToolRegistry)
- [ ] Format business context (company, lead, availability) for SDK
- [ ] Remove duplicated prompt building code from backend
- [ ] Update SalesBotService to delegate to SDK Agent
- [ ] Add rate limiting middleware (NestJS throttler or custom guard)
- [ ] Test end-to-end conversation flow
- [ ] Test tool execution (booking, lead updates)
- [ ] Test security validation (jailbreak attempts)

---

### **Phase 4: Documentation & Polish** (Week 2 - 1 day)
- [ ] Write SDK security documentation
- [ ] Write business context usage guide
- [ ] Write custom tools registration guide
- [ ] Add code examples for backend integration
- [ ] Update SDK README
- [ ] Add migration guide from backend to SDK

---

## 📊 Effort Estimation

| Task | Estimated Time | Priority |
|------|----------------|----------|
| Input Validator | 2 hours | P0 |
| Business Context API | 1 hour | P0 |
| Tests for Security | 1 hour | P0 |
| Backend Integration | 6 hours | P0 |
| Backend Rate Limiting | 1 hour | P0 |
| Documentation | 3 hours | P1 |
| **Total** | **~14 hours (1-2 days)** | |

---

## 🎯 Success Criteria

### **Must Have** (P0):
- ✅ SDK blocks common jailbreak patterns
- ✅ SDK accepts business context via PromptContext
- ✅ Backend can register custom tools (booking, lead management)
- ✅ Backend removes duplicated prompt building code
- ✅ Backend implements rate limiting (NestJS throttler)
- ✅ End-to-end conversation works with SDK Agent
- ✅ Security validation runs on every input

### **Nice to Have** (P1):
- ✅ Security incidents are logged
- ✅ Documentation with examples
- ✅ Migration guide for backend

---

## 🔄 Backend Changes Required

### **1. Register Custom Tools**
```typescript
// In backend initialization (e.g., main.ts or module setup)

import { ToolRegistry } from '@your-org/ai-receptionist-sdk';

const toolRegistry = new ToolRegistry();

// Register booking tools
toolRegistry.register({
  name: 'book_meeting',
  description: 'Book a meeting',
  parameters: { /* OpenAI function schema */ },
  handlers: {
    default: async (params, context) => {
      // Use context.userId, context.conversationId, context.toolParams
      const booking = await bookingService.create(params);
      return {
        success: true,
        response: { text: `Meeting booked for ${params.date} at ${params.time}` },
        data: booking
      };
    }
  }
});

toolRegistry.register({
  name: 'check_availability',
  description: 'Check calendar availability',
  parameters: { /* schema */ },
  handlers: {
    default: async (params, context) => {
      const slots = await bookingService.getAvailability(params.date);
      return { success: true, data: { slots } };
    }
  }
});

// Register lead management tools
toolRegistry.register({
  name: 'update_lead_details',
  description: 'Update lead information',
  parameters: { /* schema */ },
  handlers: {
    default: async (params, context) => {
      const lead = await prisma.lead.update({
        where: { id: context.toolParams.leadId },
        data: params
      });
      return { success: true, data: lead };
    }
  }
});
```

### **2. Use SDK Agent**
```typescript
// In SalesBotService or ChatService

import { Agent } from '@your-org/ai-receptionist-sdk';

export class SalesBotService {
  private agent: Agent;

  async initialize() {
    this.agent = Agent.builder()
      .withIdentity({ name: 'Sarah', role: 'Sales Representative' })
      .withPersonality({ tone: 'friendly', formalityLevel: 7 })
      .withKnowledge({ domain: 'sales', expertise: ['lead qualification'] })
      .withGoals([{ type: 'primary', description: 'Qualify and book leads' }])
      .withAIProvider(openAIProvider)
      .withToolRegistry(toolRegistry)
      .withSecurity({ inputValidation: true })
      .build();

    await this.agent.initialize();
  }

  async generateResponse(message: string, leadId: number): Promise<string> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    const user = await this.prisma.user.findUnique({ where: { id: lead.regularUserId } });

    // Format business context
    const businessContext = {
      companyInfo: `Company: ${user.company}\nOwner: ${user.name}`,
      leadInfo: `Lead: ${lead.name}\nEmail: ${lead.email}\nStatus: ${lead.status}`,
      additionalContext: await this.getBookingAvailability(user.id)
    };

    const response = await this.agent.process({
      id: `msg-${Date.now()}`,
      input: message,
      channel: 'sms',
      context: {
        conversationId: `lead-${leadId}`,
        userId: String(leadId),
        businessContext,
        toolParams: { leadId, userId: user.id } // Passed to tools
      }
    });

    return response.content;
  }
}
```

### **3. Add Rate Limiting** (Backend Responsibility)
```typescript
// backend/src/chat/chat.controller.ts

import { Controller, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('chat')
@UseGuards(ThrottlerGuard) // Apply rate limiting to all endpoints
export class ChatController {

  @Post('send')
  @Throttle(10, 60) // 10 requests per 60 seconds (per user/IP)
  async sendMessage(@Body() dto: SendMessageDto) {
    return await this.chatService.sendMessage(dto);
  }
}
```

```typescript
// backend/src/app.module.ts

import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 10, // Max requests per window
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

### **4. Remove Duplicated Code**
**Delete or Deprecate**:
- ❌ `openai-prompt-builder.service.ts` (use SDK's SystemPromptBuilder)
- ❌ `structured-prompt.service.ts` (use businessContext API)
- ❌ `prompt-helper.service.ts` (SDK handles message composition)
- ❌ Custom tool orchestration in sales-bot (SDK Agent handles it)

**Keep**:
- ✅ `prompt-templates.service.ts` (DB management - business logic)
- ✅ `strategies/` (DB management - business logic)
- ✅ `chat.controller.ts` (HTTP layer + rate limiting)
- ✅ GHL integrations (external services)

---

## 🚀 Migration Path

### **Step 1**: Add SDK features (1 day)
- Add InputValidator and BusinessContext API to SDK
- Write tests
- Update exports

### **Step 2**: Backend integration (1 day)
- Install updated SDK in backend
- Add rate limiting middleware (NestJS @nestjs/throttler)
- Register custom tools with ToolRegistry
- Initialize SDK Agent with config
- Update SalesBotService to use SDK Agent
- Test locally

### **Step 3**: Testing & validation (1 day)
- Test all conversation flows
- Test tool execution (booking, lead updates)
- Test security (jailbreak attempts)
- Test backend rate limiting (NestJS throttler)
- Performance testing

### **Step 4**: Deployment (1 day)
- Deploy backend with SDK integration
- Monitor for issues
- Rollback plan ready

---

## 💡 Key Design Principles

### **1. SDK = Generic, Backend = Business Logic**
- SDK provides: Agent orchestration, security, prompt building, tool execution
- Backend provides: Custom tools, database operations, business rules, external integrations

### **2. 80/20 Security**
- Simple regex patterns catch 80% of jailbreaks
- No heavy ML models or external services needed
- Fast, deterministic, testable

### **3. Composition Over Inheritance**
- Backend composes business context and registers tools
- SDK doesn't know about "sales", "leads", or "bookings"
- Easy to adapt SDK for other use cases (customer support, internal tools)

### **4. Observability First**
- Log all security incidents
- Trace tool executions
- Easy debugging
- Leave infrastructure monitoring (rate limits, API metrics) to backend

---

## 📝 Example: Full Backend Integration

```typescript
// backend/src/services/ai-agent.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Agent, ToolRegistry } from '@your-org/ai-receptionist-sdk';
import { PrismaService } from './prisma.service';
import { BookingService } from './booking.service';

@Injectable()
export class AIAgentService implements OnModuleInit {
  private agent: Agent;
  private toolRegistry: ToolRegistry;

  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService
  ) {}

  async onModuleInit() {
    // Initialize tool registry
    this.toolRegistry = new ToolRegistry();
    this.registerTools();

    // Initialize agent
    this.agent = Agent.builder()
      .withIdentity({
        name: 'Sarah',
        title: 'Sales Representative',
        role: 'Qualify leads and book meetings'
      })
      .withPersonality({
        tone: 'friendly',
        formalityLevel: 7,
        communicationStyle: { primary: 'consultative' }
      })
      .withKnowledge({
        domain: 'sales',
        expertise: ['lead qualification', 'appointment setting']
      })
      .withGoals([
        { type: 'primary', priority: 1, description: 'Qualify and book meetings with qualified leads' }
      ])
      .withAIProvider(this.createOpenAIProvider())
      .withToolRegistry(this.toolRegistry)
      .withSecurity({ inputValidation: true })
      .build();

    await this.agent.initialize();
  }

  private registerTools() {
    // Booking tools
    this.toolRegistry.register({
      name: 'book_meeting',
      description: 'Book a calendar meeting',
      parameters: { /* OpenAI schema */ },
      handlers: {
        default: async (params, context) => {
          const { leadId, userId } = context.toolParams;
          const booking = await this.bookingService.create({
            ...params,
            leadId,
            userId
          });
          return {
            success: true,
            response: { text: `Meeting booked for ${params.date}` },
            data: booking
          };
        }
      }
    });

    // Lead management tools
    this.toolRegistry.register({
      name: 'update_lead_details',
      description: 'Update lead information',
      parameters: { /* schema */ },
      handlers: {
        default: async (params, context) => {
          const lead = await this.prisma.lead.update({
            where: { id: context.toolParams.leadId },
            data: params
          });
          return { success: true, data: lead };
        }
      }
    });
  }

  async generateResponse(message: string, leadId: number): Promise<string> {
    // Get business data
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { regularUser: true, strategy: true }
    });

    // Format business context for SDK
    const businessContext = {
      companyInfo: this.formatCompanyInfo(lead.regularUser),
      leadInfo: this.formatLeadInfo(lead),
      additionalContext: await this.getAvailabilityContext(lead.regularUser.id)
    };

    // Process with SDK Agent
    const response = await this.agent.process({
      id: `msg-${Date.now()}`,
      input: message,
      channel: 'sms',
      context: {
        conversationId: `lead-${leadId}`,
        userId: String(leadId),
        businessContext,
        toolParams: { leadId, userId: lead.regularUser.id }
      }
    });

    return response.content;
  }

  private formatCompanyInfo(user: any): string {
    return `Company: ${user.company}
Owner: ${user.name}
Email: ${user.email}
Budget Range: ${user.budget || 'Not specified'}`;
  }

  private formatLeadInfo(lead: any): string {
    return `Lead: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}
Status: ${lead.status}
Notes: ${lead.notes || 'None'}`;
  }

  private async getAvailabilityContext(userId: number): string {
    const availability = await this.bookingService.getUpcomingAvailability(userId, 7);
    if (availability.length === 0) return '';

    return `Booking Availability (Next 7 Days):
${availability.map(day => `${day.date}: ${day.slots.join(', ')}`).join('\n')}`;
  }
}
```

---

## ✅ Final Checklist

- [ ] SDK: Add InputValidator (2 hours)
- [ ] SDK: Add businessContext to PromptContext (1 hour)
- [ ] SDK: Update SystemPromptBuilder (30 min)
- [ ] SDK: Write tests (1 hour)
- [ ] SDK: Update exports (15 min)
- [ ] Backend: Add rate limiting middleware (NestJS throttler) (1 hour)
- [ ] Backend: Register custom tools (2 hours)
- [ ] Backend: Initialize SDK Agent (1 hour)
- [ ] Backend: Format business context (1 hour)
- [ ] Backend: Update SalesBotService (2 hours)
- [ ] Backend: Remove old code (1 hour)
- [ ] Backend: Integration testing (2 hours)
- [ ] Documentation (3 hours)

**Total Estimated Time**: ~14-16 hours (1-2 days of focused work)

---

**Last Updated**: 2025-10-27
**Status**: Ready for Implementation
