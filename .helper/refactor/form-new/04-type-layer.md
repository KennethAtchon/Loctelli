# Type Layer — Single Source of Truth

> **Purpose**: Implementation guide for consolidating all form types into a single canonical location.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`, `03-dependency-graph.md`

---

## Overview

All form-related types used across the application (API, flowchart, conditional logic, profile estimation) must be defined once in `frontend/lib/forms/types.ts`. This eliminates type drift and ensures consistency.

---

## Target File: `frontend/lib/forms/types.ts`

This file defines (or re-exports) every form type. No duplication.

---

## Complete Type Definitions

### Card Media

```ts
/** Shared media for card form fields */
export interface CardMedia {
  type: "image" | "video" | "gif" | "icon";
  url?: string;
  altText?: string;
  position: "above" | "below" | "background" | "left" | "right";
  videoType?: "youtube" | "vimeo" | "upload";
  videoId?: string;
}
```

**Usage**: Used by `FormField.media` and flowchart nodes.

---

### Condition Types

```ts
export type ConditionOperator =
  | "equals" | "not_equals" | "contains" | "not_contains"
  | "greater_than" | "less_than" | "is_empty" | "is_not_empty"
  | "starts_with" | "ends_with";

export interface Condition {
  fieldId: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: Condition[];
}
```

**Usage**: Used by conditional logic evaluation and `ConditionalLogic`.

---

### Conditional Logic

```ts
export interface ConditionalLogic {
  showIf?: ConditionGroup;
  hideIf?: ConditionGroup;
  jumpTo?: { conditions: ConditionGroup; targetFieldId: string }[];
  dynamicLabel?: { conditions: ConditionGroup; label: string }[];
}
```

**Usage**: Attached to `FormField.conditionalLogic`.

---

### Form Field Types

```ts
export type FormFieldType =
  | "text" | "email" | "phone" | "textarea" | "select"
  | "checkbox" | "radio" | "file" | "image" | "statement";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  media?: CardMedia;
  conditionalLogic?: ConditionalLogic;
  enablePiping?: boolean;
}
```

**Usage**: Core type for all form fields. Used by schema, flowchart, validation, etc.

---

### Profile Estimation Types

```ts
export interface ScoringRule {
  fieldId: string;
  operator: string;
  value: unknown;
  weight?: number;
}

export interface FieldScoring {
  fieldId: string;
  scoring: {
    answer: unknown;
    points: number;
    dimension?: string;
  }[];
}

export interface AIProfileConfig {
  enabled: boolean;
  model?: string;
  prompt?: string;
  analysisType?: string;
  outputFormat?: string;
}

export interface ProfileEstimation {
  enabled: boolean;
  type: "percentage" | "category" | "multi_dimension" | "recommendation";
  aiConfig?: AIProfileConfig;
  percentageConfig?: {
    title: string;
    description: string;
    fieldScoring?: FieldScoring[];
    ranges: {
      min: number;
      max: number;
      label: string;
      description: string;
      image?: string;
    }[];
  };
  categoryConfig?: {
    title: string;
    categories: {
      id: string;
      name: string;
      description: string;
      image?: string;
      matchingLogic: ScoringRule[];
    }[];
  };
  dimensionConfig?: {
    title: string;
    dimensions: {
      id: string;
      name: string;
      fields: FieldScoring[];
    }[];
  };
  recommendationConfig?: {
    title: string;
    recommendations: {
      id: string;
      name: string;
      description: string;
      image?: string;
      matchingCriteria: ScoringRule[];
    }[];
  };
}
```

**Usage**: Used by profile estimation domain functions and form templates.

---

### Form Template Types

```ts
export interface FormTemplate {
  id: string;
  slug: string;
  name: string;
  formType: "simple" | "card";
  schema?: FormField[];
  cardSettings?: {
    flowchartGraph?: FlowchartGraph;
    // ... other card-specific settings
  };
  profileEstimation?: ProfileEstimation;
  // ... other template fields
}
```

**Note**: `FlowchartGraph` should be defined in `flowchart-types.ts` but imported here if needed for the template type.

---

## Migration Steps

### Step 1: Create `lib/forms/types.ts`

1. Create the file: `frontend/lib/forms/types.ts`
2. Copy all type definitions listed above
3. Ensure all types are exported
4. Add JSDoc comments for complex types

---

### Step 2: Update API Client

**File**: `frontend/lib/api/endpoints/forms.ts`

**Changes**:
1. Remove all form type definitions (e.g. `FormField`, `Condition`, `CardMedia`, etc.)
2. Add imports: `import type { FormField, Condition, CardMedia, ... } from '@/lib/forms/types'`
3. Update function signatures to use imported types
4. Remove any re-exports of form types

**Before**:
```ts
// lib/api/endpoints/forms.ts
export interface FormField { ... } // ❌ Remove

export async function getFormTemplate(...): Promise<FormTemplate> {
  // Uses FormField
}
```

**After**:
```ts
// lib/api/endpoints/forms.ts
import type { FormField, FormTemplate } from '@/lib/forms/types'; // ✅ Import

export async function getFormTemplate(...): Promise<FormTemplate> {
  // Uses imported FormField
}
```

---

### Step 3: Update Flowchart Types

**File**: `frontend/lib/forms/flowchart-types.ts` (or wherever flowchart types are)

**Changes**:
1. Remove duplicate `CardMedia` definition (if exists)
2. Import `CardMedia` from `./types`
3. Import `FormField` from `./types` (not from `@/lib/api`)
4. Ensure `FlowchartNodeData` uses imported types

**Before**:
```ts
// flowchart-types.ts
import type { FormField } from '@/lib/api'; // ❌ Wrong import
export interface CardMedia { ... } // ❌ Duplicate
```

**After**:
```ts
// flowchart-types.ts
import type { FormField, CardMedia } from './types'; // ✅ Correct import
// No duplicate CardMedia
```

---

### Step 4: Update Domain Files

**Files**:
- `lib/forms/conditional-logic.ts`
- `lib/forms/profile-estimation.ts`
- `lib/forms/flowchart-serialization.ts`
- `lib/forms/form-validation.ts`

**Changes**:
1. Change imports from `@/lib/api` to `./types` (or `@/lib/forms/types`)
2. Ensure all type references use imported types

**Before**:
```ts
// conditional-logic.ts
import type { FormField, Condition } from '@/lib/api'; // ❌ Wrong
```

**After**:
```ts
// conditional-logic.ts
import type { FormField, Condition } from './types'; // ✅ Correct
```

---

### Step 5: Find and Update All Consumers

**Search for imports**:
```bash
# Find all files importing form types from @/lib/api
grep -r "from '@/lib/api'" frontend/ --include="*.ts" --include="*.tsx"
grep -r 'from "@/lib/api"' frontend/ --include="*.ts" --include="*.tsx"
```

**Update each file**:
1. Change `import type { FormField, ... } from '@/lib/api'` to `import type { FormField, ... } from '@/lib/forms/types'`
2. Change `import { FormField, ... } from '@/lib/api'` to `import type { FormField, ... } from '@/lib/forms/types'` (use `type` import if only types are needed)

**Files to check**:
- All component files using form types
- All hook files using form types
- Any utility files using form types
- Builder/editor components

---

### Step 6: Remove Re-exports

**Check**: Ensure no file re-exports form types from `@/lib/api`:

```bash
# Search for re-exports
grep -r "export.*FormField.*from" frontend/lib/api/ --include="*.ts"
```

**Remove**: Any re-exports found.

---

### Step 7: Verify

1. **Type Check**: Run `tsc --noEmit` - should pass with no errors
2. **Search for Duplicates**: Search for `interface FormField` or `type FormField` - should only appear in `lib/forms/types.ts`
3. **Search for Wrong Imports**: Search for `from '@/lib/api'` with form types - should find none
4. **Test**: Run the app and verify forms still work

---

## Common Issues and Fixes

### Issue 1: Type Mismatch Between API and Frontend

**Symptom**: TypeScript errors about incompatible types.

**Fix**: Ensure API DTOs align with frontend types. If backend returns different structure, add transformation layer in API client:

```ts
// lib/api/endpoints/forms.ts
import type { FormField } from '@/lib/forms/types';

export async function getFormTemplate(slug: string): Promise<FormTemplate> {
  const response = await fetch(...);
  const dto = await response.json();
  // Transform DTO to match FormTemplate type
  return transformDtoToTemplate(dto);
}
```

---

### Issue 2: Missing Types

**Symptom**: TypeScript errors about missing types.

**Fix**: Add missing types to `lib/forms/types.ts`. Check:
- Backend DTOs for fields not in frontend types
- Flowchart types for missing fields
- Profile estimation config for missing fields

---

### Issue 3: Circular Type Dependencies

**Symptom**: TypeScript errors about circular references.

**Fix**: 
- Ensure `types.ts` doesn't import from other form files
- If `FormTemplate` needs `FlowchartGraph`, define `FlowchartGraph` in `flowchart-types.ts` and import it in `types.ts` (or use a forward reference)

---

## Verification Checklist

- [ ] `lib/forms/types.ts` exists with all form types
- [ ] `lib/api/endpoints/forms.ts` imports types from `@/lib/forms/types`
- [ ] `lib/api/endpoints/forms.ts` has no form type definitions
- [ ] `flowchart-types.ts` imports from `./types` (not `@/lib/api`)
- [ ] All domain files import from `./types` (not `@/lib/api`)
- [ ] All component/hook files import from `@/lib/forms/types` (not `@/lib/api`)
- [ ] No duplicate type definitions exist
- [ ] No re-exports of form types from `@/lib/api`
- [ ] `tsc --noEmit` passes
- [ ] Forms still work in the app

---

## Implementation Order

1. **Create types file** - Add all type definitions to `lib/forms/types.ts`
2. **Update API client** - Remove type definitions, add imports
3. **Update domain files** - Change imports to `./types`
4. **Update flowchart types** - Import from `./types`
5. **Update all consumers** - Change imports to `@/lib/forms/types`
6. **Verify** - Type check and test

---

## Summary

**Goal**: Single source of truth for all form types in `lib/forms/types.ts`.

**Key Changes**:
- Create `lib/forms/types.ts` with all form types
- Remove form type definitions from `lib/api/endpoints/forms.ts`
- Update all imports to use `@/lib/forms/types`
- No backwards compatibility - update all files in one pass

**Result**: 
- No duplicate type definitions
- Consistent types across the application
- Easier maintenance (one place to update types)

---

## Next Steps

1. Implement `lib/forms/types.ts` with all type definitions
2. Update API client to import types
3. Update all consumers
4. Verify with type check
5. Proceed to `05-domain-layer.md` for domain implementation
