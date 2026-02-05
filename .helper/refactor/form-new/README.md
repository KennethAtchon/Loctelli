# Form System Re-Architecture

This directory contains the architecture specification and modular implementation guides for the form system refactoring.

## Files

### Main Architecture Document
- **08-form-system-rearchitecture.md** - The complete architecture specification document (original)

### Modular Implementation Guides

The architecture has been broken down into focused, detailed guides that can be implemented one part at a time:

#### Foundation & Principles
- **01-design-principles.md** - Core architectural principles and design decisions
- **02-state-effects-discipline.md** - Detailed rules for useState/useEffect usage
- **03-dependency-graph.md** - Enforced dependency structure and rules

#### Implementation Layers
- **04-type-layer.md** - Single source of truth for all form types
- **05-domain-layer.md** - Pure domain functions (conditional logic, validation, profile estimation)
- **06-service-layer.md** - API client implementation and migration
- **07-card-form-hooks.md** - Card form hooks (schema, session, navigation, data, profile, orchestrator)
- **08-simple-form-hooks.md** - Simple form hooks and components
- **09-shared-ui.md** - Shared FieldRenderer component for both form types

#### Structure & Process
- **10-file-structure.md** - Complete target file structure and organization
- **11-backend-considerations.md** - Backend alignment and DTO verification
- **12-implementation-order.md** - Step-by-step implementation guide with phases
- **13-testing.md** - Testing strategy and recommendations

## Purpose

This refactoring addresses:
- Circular dependencies between form types
- Overuse of `useState`/`useEffect` in card form
- God component (880-line `card-form-container.tsx`)
- Duplicate type definitions across the codebase
- Lack of shared validation logic

## Key Principles

1. **Single source of truth**: All form types in `lib/forms/types.ts`
2. **Unidirectional dependencies**: Types → Domain → Services → Hooks → UI
3. **Pure domain layer**: No React, no API calls in domain functions
4. **State discipline**: `useReducer` for machine state, `useMemo` for derived state, `useEffect` only for side effects
5. **Thin containers**: Split god component into focused hooks and presentational components

## Implementation Status

🚧 **Not yet implemented** - This is the specification phase.

## How to Use These Documents

### For Understanding the Architecture
1. Start with **01-design-principles.md** for foundational concepts
2. Read **02-state-effects-discipline.md** to understand state management rules
3. Review **03-dependency-graph.md** for dependency structure
4. Skim through **04-09** to understand each layer

### For Implementation
1. Follow **12-implementation-order.md** for step-by-step guidance
2. Reference individual guides (04-09) for detailed implementation of each layer
3. Use **10-file-structure.md** as a reference for file organization
4. Check **11-backend-considerations.md** before API integration
5. Follow **13-testing.md** for testing strategy

### Recommended Reading Order

**First Time**:
1. 01-design-principles.md
2. 02-state-effects-discipline.md
3. 03-dependency-graph.md
4. 12-implementation-order.md (overview)
5. Then dive into specific layers (04-09) as needed

**During Implementation**:
1. Follow 12-implementation-order.md phase by phase
2. Reference specific layer guides (04-09) for each phase
3. Use 10-file-structure.md for file organization
4. Check 11-backend-considerations.md for API alignment
5. Write tests following 13-testing.md

## Next Steps

1. Review **01-design-principles.md** to understand the architecture
2. Read **12-implementation-order.md** to understand the implementation plan
3. Start with Phase 1 (Types and Domain Layer) following the step-by-step guide
4. Test incrementally at each step
5. Reference specific guides (04-09) for detailed implementation
