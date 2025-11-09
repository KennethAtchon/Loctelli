# Implementation Plan: Autopersist, Agent Config, Dev Tools, and Agent Info Modal

## Overview
This document outlines the comprehensive plan for implementing 5 key features:
1. Add autopersist configuration to SDK factory
2. Hardcode autopersist to always be enabled on server-side
3. Display SDK-created tables in /dev frontend page
4. Add agent details button/modal to chat interface
5. Add `withAgentConfig()` method to Agent class

---

## 1. Add Autopersist to SDK Factory

### Current State
- Autopersist is configured in `MemoryConfig` at the agent instance level
- Factory creates agents with memory config passed via `AgentInstanceConfig`
- Factory doesn't currently set autopersist defaults

### Implementation Steps

#### 1.1 Update Factory Types
**File**: `services/AI-receptionist/src/factory/types.ts`
- Add `autoPersist` option to `AgentInstanceConfig.memory` interface (already exists)
- Ensure type includes: `minImportance?: number`, `types?: Memory['type'][]`, `persistAll?: boolean`

#### 1.2 Update Factory Implementation
**File**: `services/AI-receptionist/src/factory/AIReceptionistFactory.ts`
- In `createAgent()` method, when configuring memory (around line 223-248):
  - Add autopersist configuration to memory config when using shared long-term memory
  - Default: `persistAll: true` (to persist all memories)
  - Allow override via `config.memory?.autoPersist` if provided

**Code Location**: Lines 223-248 in `createAgent()` method
```typescript
builder.withMemory({
  contextWindow: config.memory?.contextWindow || 20,
  longTermEnabled: true,
  sharedLongTermMemory: this.sharedLongTermMemory,
  autoPersist: config.memory?.autoPersist || {
    persistAll: true  // Default: persist all memories
  }
});
```

#### 1.3 Update Type Definitions
**File**: `services/AI-receptionist/src/agent/types.ts`
- Verify `MemoryConfig` interface includes `autoPersist` (already exists at line 318-322)
- Ensure types are properly exported

---

## 2. Hardcode Autopersist on Server-Side

### Current State
- Server uses `AgentFactoryService` to create agents
- Agent config comes from `getAgentConfig()` method
- Memory config is passed through `AgentInstanceConfig`

### Implementation Steps

#### 2.1 Update Agent Config Service
**File**: `project/src/main-app/modules/ai-receptionist/config/agent-config.service.ts`
- In `getAgentConfig()` method:
  - Ensure memory config includes `autoPersist: { persistAll: true }`
  - This should override any other autopersist settings
  - Hardcode it so it's always enabled

**Code Location**: Around line 50 where `agentConfig` is created
```typescript
const agentConfig: AgentInstanceConfig = {
  // ... existing config ...
  memory: {
    contextWindow: 20,
    autoPersist: {
      persistAll: true  // Always persist all memories on server
    }
  }
};
```

#### 2.2 Verify Factory Service
**File**: `project/src/main-app/modules/ai-receptionist/agent-factory.service.ts`
- Ensure `getOrCreateAgent()` passes through the memory config correctly
- No changes needed if config flows through properly

---

## 3. Display SDK Tables in /dev Frontend

### Current State
- `/dev` page exists at `my-app/app/admin/(main)/dev/page.tsx`
- Already has `DatabaseSchema` component
- SDK creates tables: `ai_receptionist_memory`, `ai_receptionist_leads`, `ai_receptionist_call_logs`, `ai_receptionist_allowlist`

### Implementation Steps

#### 3.1 Create API Endpoint for SDK Tables
**File**: `project/src/main-app/modules/ai-receptionist/` (new controller or extend existing)
- Create endpoint: `GET /api/proxy/ai-receptionist/dev/tables`
- Query database for tables matching pattern `ai_receptionist_*`
- Return table names, column info, row counts
- Use existing database connection from factory service

**Endpoint Structure**:
```typescript
{
  tables: [
    {
      name: "ai_receptionist_memory",
      columns: [...],
      rowCount: 1234,
      createdAt: "2024-01-01T00:00:00Z"
    },
    // ... other tables
  ]
}
```

#### 3.2 Create Frontend Component
**File**: `my-app/components/admin/sdk-tables.tsx` (new file)
- Component to display SDK-created tables
- Show table name, columns, row counts
- Use similar styling to `DatabaseSchema` component
- Fetch data from new API endpoint

#### 3.3 Update Dev Page
**File**: `my-app/app/admin/(main)/dev/page.tsx`
- Add new section for "SDK Tables" after Database Schema section
- Import and render `SDKTables` component
- Add appropriate heading and description

**Code Location**: After line 140 (Database Schema section)

---

## 4. Agent Details Button and Modal

### Current State
- Chat interface: `my-app/components/chat/chat-interface.tsx`
- Chat page: `my-app/app/admin/(main)/chat/page.tsx`
- Agent instance available via API calls

### Implementation Steps

#### 4.1 Create API Endpoint for Agent Info
**File**: `project/src/main-app/modules/ai-receptionist/` (controller)
- Create endpoint: `GET /api/proxy/ai-receptionist/dev/agent-info?userId=X&leadId=Y`
- Get agent instance from factory service
- Extract:
  - Agent identity (name, role)
  - Tools (from toolRegistry.listAvailable())
  - Provider info (from providerRegistry.list())
  - Memory config (autoPersist settings)
  - Model provider (OpenAI, etc.)
  - System prompt preview

**Response Structure**:
```typescript
{
  identity: { name: string, role: string },
  tools: Array<{ name: string, description: string }>,
  providers: string[],
  model: { provider: string, model: string },
  memory: { autoPersist: {...}, contextWindow: number },
  systemPromptPreview: string
}
```

#### 4.2 Create Agent Info Modal Component
**File**: `my-app/components/admin/agent-info-modal.tsx` (new file)
- Modal component using shadcn/ui Dialog
- Display agent information in organized sections:
  - Identity (name, role)
  - Model Provider (OpenAI, model name)
  - Tools (list with descriptions)
  - Providers (configured providers)
  - Memory Config (autopersist settings, context window)
  - System Prompt (collapsible preview)
- Use Card components for sections
- Add copy buttons for important info

#### 4.3 Add Button to Chat Interface
**File**: `my-app/components/chat/chat-interface.tsx`
- Add info button in header area (if header is shown) or near input area
- Use Info icon from lucide-react
- Button should accept `onAgentInfoClick` callback prop
- Position: top-right of chat container or near input area

**Code Location**: 
- If header exists: Add to header section (around line 541-557)
- Otherwise: Add near input area (around line 585-714)

#### 4.4 Integrate in Chat Page
**File**: `my-app/app/admin/(main)/chat/page.tsx`
- Add state for modal open/close
- Add handler to fetch agent info and open modal
- Pass handler to ChatInterface component
- Render AgentInfoModal component
- Pass userId and leadId to modal (from selectedLeadId)

**Code Location**: 
- Add state around line 66
- Add handler function
- Pass to ChatInterface around line where it's rendered
- Render modal component

---

## 5. Add `withAgentConfig()` to Agent Class

### Current State
- Agent class uses builder pattern via `AgentBuilder`
- Config is set during construction
- No method to update config after creation

### Implementation Steps

#### 5.1 Add Method to Agent Class
**File**: `services/AI-receptionist/src/agent/core/Agent.ts`
- Add `withAgentConfig()` method
- Accept partial `AgentConfiguration` or specific config sections
- Update internal config properties
- Mark prompt for rebuild if identity/personality/knowledge/goals change
- Rebuild memory if memory config changes
- Return `this` for chaining

**Method Signature**:
```typescript
public withAgentConfig(config: Partial<AgentConfiguration>): this {
  // Update identity if provided
  if (config.identity) {
    // Update identity component
    this.markPromptForRebuild();
  }
  // Similar for personality, knowledge, goals, memory
  return this;
}
```

**Code Location**: After `markPromptForRebuild()` method (around line 652)

#### 5.2 Handle Memory Config Updates
- If memory config changes:
  - Dispose old memory manager
  - Create new memory manager with new config
  - Reinitialize memory

#### 5.3 Update Type Definitions
**File**: `services/AI-receptionist/src/agent/types.ts`
- Ensure `AgentConfiguration` is properly exported
- May need to make some properties mutable (currently readonly)

#### 5.4 Add Tests (Optional)
- Test updating identity
- Test updating memory config
- Test prompt rebuild after config change

---

## Implementation Order

1. **Phase 1**: SDK Factory Autopersist (Task 1)
   - Update factory to support autopersist
   - Test factory creates agents with autopersist

2. **Phase 2**: Server-Side Hardcoding (Task 2)
   - Update agent config service
   - Verify autopersist is always enabled

3. **Phase 3**: Agent Config Method (Task 5)
   - Add `withAgentConfig()` to Agent class
   - Test config updates work correctly

4. **Phase 4**: Dev Tools (Task 3)
   - Create API endpoint for tables
   - Create frontend component
   - Update dev page

5. **Phase 5**: Agent Info Modal (Task 4)
   - Create API endpoint
   - Create modal component
   - Add button to chat interface
   - Integrate in chat page

---

## Testing Checklist

### Task 1: Factory Autopersist
- [ ] Factory creates agents with autopersist config
- [ ] Autopersist can be overridden per agent
- [ ] Default is persistAll: true

### Task 2: Server Autopersist
- [ ] All agents created on server have autopersist enabled
- [ ] persistAll is always true
- [ ] Memories are persisted correctly

### Task 3: SDK Tables Display
- [ ] API endpoint returns correct table information
- [ ] Frontend displays tables correctly
- [ ] Tables show correct row counts
- [ ] Column information is accurate

### Task 4: Agent Info Modal
- [ ] API endpoint returns correct agent info
- [ ] Modal displays all information correctly
- [ ] Button appears in chat interface
- [ ] Modal opens/closes correctly
- [ ] Information is accurate for current agent

### Task 5: withAgentConfig Method
- [ ] Method updates identity correctly
- [ ] Method updates memory config correctly
- [ ] Prompt rebuilds after config change
- [ ] Method returns agent for chaining
- [ ] Memory manager reinitializes on memory config change

---

## Files to Modify

### SDK (services/AI-receptionist/)
1. `src/factory/AIReceptionistFactory.ts` - Add autopersist to factory
2. `src/factory/types.ts` - Verify types support autopersist
3. `src/agent/core/Agent.ts` - Add `withAgentConfig()` method
4. `src/agent/types.ts` - Verify MemoryConfig types

### Server (project/src/main-app/)
1. `modules/ai-receptionist/config/agent-config.service.ts` - Hardcode autopersist
2. `modules/ai-receptionist/` - Create agent info endpoint (new controller or extend existing)

### Frontend (my-app/)
1. `app/admin/(main)/dev/page.tsx` - Add SDK tables section
2. `components/admin/sdk-tables.tsx` - New component for SDK tables
3. `components/admin/agent-info-modal.tsx` - New modal component
4. `components/chat/chat-interface.tsx` - Add info button
5. `app/admin/(main)/chat/page.tsx` - Integrate modal

---

## Notes

- Autopersist configuration uses `persistAll: true` to ensure all memories are persisted
- Agent info modal requires agent instance, so it needs userId and leadId
- SDK tables are prefixed with `ai_receptionist_` for easy identification
- `withAgentConfig()` should be used carefully as it modifies agent state
- All API endpoints should use `/api/proxy` prefix per project conventions

