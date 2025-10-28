# AI Receptionist SDK Migration Checklist

This checklist identifies backend code in `/project` that should be migrated to the AI-receptionist SDK in `/services/AI-receptionist`.

## ✅ What's Already in the SDK

The SDK already has these well-structured components:

- ✅ **Agent Core**: `Agent.ts`, `AgentBuilder.ts`, `Identity.ts`
- ✅ **Prompt System**: `SystemPromptBuilder.ts`, `PromptOptimizer.ts`
- ✅ **Memory Management**: `ShortTermMemory.ts`, `LongTermMemory.ts`, `VectorMemory.ts`, `MemoryManager.ts`
- ✅ **AI Providers**: OpenAI and OpenRouter providers with proper interfaces
- ✅ **Tools System**: Tool registry, builder, and standard tools (database, email, calendar, messaging, calls)
- ✅ **Session Management**: SessionManager with proper types
- ✅ **Observability**: AgentLogger, InteractionTracer
- ✅ **Storage**: DatabaseStorage, InMemoryStorage with migrations
- ✅ **Provider System**: Core provider registry, proxy, errors, validation

---

## 🔄 What Needs to Be Migrated from `/project`

### 1. **Prompt Building & Composition** ⭐ HIGH PRIORITY

#### Files to Migrate:
- `project/src/main-app/modules/chat/openai-prompt-builder.service.ts` (352 lines)
  - **What**: Advanced hierarchical prompt builder with security validation
  - **Features**:
    - Priority-based section ordering
    - Immutable sections (core identity, security layer)
    - Security validation (malicious patterns, conflicting instructions)
    - Section types: role, instruction, context, custom, security, core_identity
    - Security report generation
    - Builder state inspection
  - **Target in SDK**: Should merge with or replace `src/agent/prompt/SystemPromptBuilder.ts`
  - **Key interfaces**: `PromptSection`, `SecurityValidation`

- `project/src/main-app/modules/chat/structured-prompt.service.ts` (573 lines)
  - **What**: Business logic for building structured system prompts
  - **Features**:
    - Business context formatting (company info, lead info, conversation state)
    - Conversation rules generation
    - Booking availability integration
    - Tool instructions formatting
    - Output format requirements
    - Timezone-aware scheduling context
    - Default schedule generation (9-5 EST with 30-min slots)
  - **Target in SDK**: Create new `src/agent/prompt/BusinessPromptBuilder.ts`
  - **Dependencies**: Needs access to database/context data

- `project/src/main-app/modules/chat/prompt-helper.service.ts` (166 lines)
  - **What**: Message composition and format conversion for OpenAI API
  - **Features**:
    - Convert message history formats (from/message vs role/content)
    - Handle summarized conversation messages
    - Compose full prompt arrays (system + history)
    - Template integration
  - **Target in SDK**: Create `src/agent/prompt/MessageComposer.ts`

#### Migration Strategy:
```
1. Extract prompt builder interfaces and types → SDK types
2. Merge openai-prompt-builder with SDK's SystemPromptBuilder
3. Port structured-prompt business logic → new BusinessPromptBuilder
4. Port prompt-helper message composition → MessageComposer
5. Ensure security validation is preserved
6. Update backend to use SDK prompt builders
```

---

### 2. **Conversation Management & Summarization** ⭐ HIGH PRIORITY

#### Files to Migrate:
- `project/src/main-app/modules/chat/conversation-summarizer.service.ts` (163 lines)
  - **What**: Automatic conversation summarization when history exceeds threshold
  - **Features**:
    - Summarization threshold: 50 messages
    - Summarizes first 30 messages into system message
    - Uses GPT-4o-mini for summary generation
    - Metadata tracking (summarized: true, originalMessageCount, summaryCreatedAt)
    - Graceful error handling (returns original history on failure)
  - **Target in SDK**: Create `src/agent/memory/ConversationSummarizer.ts`
  - **Integration**: Should work with `MemoryManager.ts`

#### Migration Strategy:
```
1. Create ConversationSummarizer in SDK memory module
2. Integrate with MemoryManager for automatic summarization
3. Make summarization configurable (threshold, message count, model)
4. Add observability hooks (trace summarization events)
5. Update backend to use SDK's summarization
```

---

### 3. **AI Tools & Function Calling** ⭐ HIGH PRIORITY

#### Files to Migrate:
- `project/src/main-app/modules/chat/ai-tools.service.ts` (1143 lines)
  - **What**: Comprehensive AI function calling system for booking, lead management, conversation state
  - **Features**:
    - **Booking Tools**:
      - `book_meeting`: Create calendar meetings with timezone handling
      - `check_availability`: Query available time slots from bookingsTime JSON
      - Timezone validation (IANA format)
      - Conflict detection
      - Date validation (no past dates, max 30 days ahead)
      - BookingsTime data quality validation
    - **Lead Management Tools**:
      - `update_lead_details`: Update lead email, phone, company, position, timezone, notes
      - `update_conversation_state`: Track sales progress (stage, qualified, budget/timeline discussed, pain points, objections)
    - **Advanced Features**:
      - Timezone info extraction (offset, abbreviation)
      - 12-hour time formatting
      - Slot parsing from multiple bookingsTime formats (array, object, GHL format)
      - Cross-reference DB bookings with available slots
      - Fallback slot generation (9-5 with 30-min intervals)
  - **Target in SDK**: Enhance `src/tools/standard/` modules
  - **Key interfaces**: `BookingToolArgs`, `AvailabilityToolArgs`, `UpdateLeadToolArgs`, `ConversationState`, `ToolCallResult`

#### Migration Strategy:
```
1. Extract booking logic → enhance src/tools/standard/calendar-tools.ts
2. Extract lead management → create src/tools/standard/lead-tools.ts
3. Port timezone handling utilities → src/utils/timezone.ts
4. Port validation logic → src/tools/validation/
5. Ensure tool definitions match OpenAI function calling format
6. Make tools configurable and extensible
```

---

### 4. **Security & Input Validation** ⭐ HIGH PRIORITY

#### Files to Migrate:
- `project/src/shared/security/prompt-security.service.ts` (file not fully read)
  - **What**: Security validation for user inputs (jailbreak detection, rate limiting)
  - **Features used in sales-bot**:
    - `checkRateLimit(leadId)`: Rate limit checks per lead
    - `analyzeInput(message, leadId)`: Input analysis for jailbreak attempts
    - `logSecurityIncident()`: Security incident logging
    - `generateSecurityResponse(level)`: Secure fallback responses
  - **Target in SDK**: Create `src/agent/security/` module
  - **Integration**: Should be used by Agent core before processing messages

- `project/src/shared/security/secure-conversation.service.ts` (not read yet)
  - **What**: Likely conversation-level security features
  - **Target in SDK**: Review and port to `src/agent/security/ConversationSecurity.ts`

#### Migration Strategy:
```
1. Create SDK security module structure
2. Port input validation and jailbreak detection
3. Port rate limiting (may need external state management)
4. Add security hooks to Agent.process() method
5. Make security rules configurable
6. Add security telemetry/logging
```

---

### 5. **AI Response Generation & Orchestration** ⭐ MEDIUM PRIORITY

#### Files to Review/Migrate:
- `project/src/main-app/modules/chat/sales-bot.service.ts` (549 lines)
  - **What**: Main orchestration service for AI conversation lifecycle
  - **Features**:
    - Message generation with security checks
    - Tool call execution and handling
    - Conversation history management
    - Follow-up message scheduling
    - Conversation initiation (AI sends first message)
    - Multi-turn conversations with tool results
  - **What to Port**:
    - Tool call orchestration pattern (especially multi-turn with tool results)
    - Security integration pattern
    - Conversation lifecycle hooks (initiate, follow-up)
  - **Target in SDK**: Enhance `src/agent/core/Agent.ts` with these orchestration patterns
  - **Note**: Business logic should stay in backend, but patterns should be in SDK

- `project/src/main-app/modules/chat/chat.service.ts` (151 lines)
  - **What**: HTTP-level chat service (thin wrapper)
  - **Migration**: Most logic already delegated to sales-bot. Minimal SDK changes needed.

#### Migration Strategy:
```
1. Extract tool call orchestration pattern → Agent.processWithTools()
2. Extract multi-turn conversation pattern → Agent.handleToolCallbacks()
3. Add conversation lifecycle hooks to Agent (onInit, onFollowUp)
4. Keep business logic (sales-specific) in backend
5. Make orchestration generic and reusable
```

---

### 6. **Prompt Templates & Configuration** 🔄 MEDIUM PRIORITY

#### Files to Review:
- `project/src/main-app/modules/prompt-templates/prompt-templates.service.ts`
- `project/src/main-app/modules/prompt-templates/prompt-templates.controller.ts`
- `project/src/main-app/modules/prompt-templates/dto/*.dto.ts`

**What**: Database-backed prompt template management (per-subaccount)
- Template CRUD operations
- Active template selection
- Fields: `baseSystemPrompt`, `temperature`, `maxTokens`, `topP`, `frequencyPenalty`, `presencePenalty`

**Migration Strategy**:
```
- SDK should accept template configuration (not manage DB)
- Backend keeps template management
- SDK exports TypeScript interfaces for templates
- Consider: Agent.configure(templateConfig) API
```

---

### 7. **Strategy Configuration** 🔄 MEDIUM PRIORITY

#### Files to Review:
- `project/src/main-app/modules/strategies/` (DTOs)

**What**: Sales strategy configuration (personality, goals, rules)
- Used in structured prompt building for:
  - AI name/role
  - Conversation tone/style
  - Qualification questions
  - Objection handling
  - Booking instructions
  - Industry context

**Migration Strategy**:
```
- Keep strategy management in backend (business-specific)
- SDK should have generic Strategy/Personality interfaces
- Export from SDK: src/agent/types/Strategy.ts
- Backend implements business-specific strategy logic
```

---

## 📋 Migration Priority Matrix

| Priority | Component | Lines | Complexity | Impact |
|----------|-----------|-------|------------|--------|
| 🔴 **P0** | Prompt Building System | ~1091 | High | Critical for all AI interactions |
| 🔴 **P0** | AI Tools & Function Calling | ~1143 | High | Core functionality |
| 🔴 **P0** | Security & Validation | ~??? | Medium | Security-critical |
| 🟡 **P1** | Conversation Summarization | ~163 | Medium | Performance optimization |
| 🟡 **P1** | Tool Call Orchestration | ~200 | Medium | Better SDK patterns |
| 🟢 **P2** | Template Interfaces | ~50 | Low | Type safety |
| 🟢 **P2** | Strategy Interfaces | ~30 | Low | Type safety |

---

## 🏗️ Recommended Migration Phases

### **Phase 1: Core Prompt System** (Week 1-2)
- [ ] Port `PromptSection` interfaces and types
- [ ] Merge `openai-prompt-builder` with SDK's `SystemPromptBuilder`
- [ ] Add security validation to prompt builder
- [ ] Create `BusinessPromptBuilder` for structured prompts
- [ ] Create `MessageComposer` for message array composition
- [ ] Write tests for prompt builders

### **Phase 2: Tools & Functions** (Week 2-3)
- [ ] Port booking tools to `calendar-tools.ts`
- [ ] Create new `lead-tools.ts` for lead management
- [ ] Port timezone utilities
- [ ] Port validation logic
- [ ] Update tool definitions for OpenAI function calling
- [ ] Write tests for tools

### **Phase 3: Security Layer** (Week 3-4)
- [ ] Create `src/agent/security/` module
- [ ] Port input validation and jailbreak detection
- [ ] Port rate limiting (with state management strategy)
- [ ] Integrate security hooks in Agent core
- [ ] Add security telemetry
- [ ] Write security tests

### **Phase 4: Memory & Summarization** (Week 4)
- [ ] Create `ConversationSummarizer` in memory module
- [ ] Integrate with `MemoryManager`
- [ ] Add configuration options
- [ ] Add observability hooks
- [ ] Write tests for summarization

### **Phase 5: Orchestration Patterns** (Week 5)
- [ ] Extract tool call orchestration to Agent
- [ ] Add multi-turn conversation support
- [ ] Add conversation lifecycle hooks
- [ ] Document orchestration patterns
- [ ] Write integration tests

### **Phase 6: Cleanup & Documentation** (Week 6)
- [ ] Update backend to use SDK
- [ ] Remove duplicated code from backend
- [ ] Write migration guide
- [ ] Update SDK documentation
- [ ] Add examples and usage patterns

---

## 🎯 SDK Design Principles to Follow

1. **Separation of Concerns**:
   - SDK = Generic AI agent capabilities
   - Backend = Business-specific logic (sales, CRM)

2. **Configuration Over Code**:
   - Make everything configurable
   - Avoid hardcoded business logic in SDK

3. **Extensibility**:
   - Use interfaces and abstract classes
   - Allow custom tools, memory stores, providers

4. **Observability**:
   - Instrument all key operations
   - Use `AgentLogger` and `InteractionTracer`

5. **Type Safety**:
   - Export all interfaces and types
   - Maintain strict TypeScript types

6. **Testing**:
   - Unit tests for all migrated components
   - Integration tests for complex workflows

---

## 📝 Post-Migration Validation

- [ ] All prompt building uses SDK builders
- [ ] All tool calls go through SDK tool system
- [ ] Security validation happens in SDK
- [ ] Conversation summarization works via SDK
- [ ] Backend only contains business logic
- [ ] SDK is independently testable
- [ ] SDK has comprehensive documentation
- [ ] Performance is maintained or improved
- [ ] No security regressions
- [ ] All tests pass

---

## 🔍 Files to Keep in Backend (Not SDK)

These should remain in `/project` as they're business/CRM-specific:

- ✅ `chat.service.ts` - HTTP endpoints and business routing
- ✅ `sales-bot.service.ts` - Sales-specific orchestration (use SDK Agent underneath)
- ✅ `prompt-templates.service.ts` - Database CRUD for templates
- ✅ `strategies/` - Sales strategy management
- ✅ All NestJS modules, controllers, DTOs
- ✅ Database/Prisma integration
- ✅ GHL integrations
- ✅ Booking helper (GHL-specific booking logic)
- ✅ Email/SMS campaign services

---

## 💡 Key Insights

### What Makes Good SDK Code:
- **Generic and reusable** across different domains
- **Well-typed** with clear interfaces
- **Configurable** without hardcoded logic
- **Observable** with proper logging/tracing
- **Testable** in isolation

### What Stays in Backend:
- **Business rules** specific to sales/CRM
- **Database operations** and persistence
- **External integrations** (GHL, Twilio, etc.)
- **HTTP/API layer** concerns
- **Multi-tenant logic** and subaccount isolation

---

## 📊 Estimated Effort

- **Total Lines to Migrate**: ~2,500-3,000
- **New SDK Code Required**: ~1,500-2,000 (with refactoring)
- **Tests to Write**: ~1,000-1,500
- **Documentation**: ~500-800 lines
- **Total Estimated Time**: 4-6 weeks (1 developer)

---

## ✅ Success Metrics

- [ ] SDK can be used standalone (without backend)
- [ ] 90%+ test coverage on migrated code
- [ ] Backend code reduced by 40%+
- [ ] Zero security regressions
- [ ] API response time unchanged or improved
- [ ] SDK published as npm package (future)
- [ ] Documentation complete with examples

---

**Last Updated**: 2025-10-27
**Status**: Planning Phase
