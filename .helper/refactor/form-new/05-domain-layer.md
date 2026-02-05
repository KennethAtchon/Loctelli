# Domain Layer — Pure Functions

> **Purpose**: Implementation guide for the pure domain layer with no React or API dependencies.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`, `03-dependency-graph.md`, `04-type-layer.md`

---

## Overview

The domain layer contains pure business logic functions with no side effects. These functions are:
- Testable without React or network mocks
- Reusable across different contexts
- Predictable (no side effects)
- Independent of UI or API implementation

**Location**: `frontend/lib/forms/*.ts`

**Rule**: Import only from `./types` (or `@/lib/forms/types`). No React, no `fetch`, no hooks.

---

## File Structure

```
lib/forms/
├── types.ts                    # Types (from 04-type-layer.md)
├── conditional-logic.ts       # Field visibility, conditional evaluation
├── flowchart-types.ts         # Flowchart-specific types (depends on types.ts)
├── flowchart-serialization.ts # Convert between flowchart and schema
├── profile-estimation.ts      # Profile calculation logic
├── form-validation.ts         # Validation and initial data
└── navigation.ts              # Navigation logic (optional)
```

---

## File 1: `conditional-logic.ts`

**Purpose**: Evaluate conditions, determine field visibility, handle jumps, and apply piping.

**Imports**: `Condition`, `ConditionGroup`, `FormField` from `./types`.

**Exports**:

### `evaluateCondition`

```ts
/**
 * Evaluates a single condition against form data.
 * @param condition - The condition to evaluate
 * @param formData - Current form data values
 * @returns true if condition is met, false otherwise
 */
export function evaluateCondition(
  condition: Condition,
  formData: Record<string, unknown>
): boolean {
  const fieldValue = formData[condition.fieldId];
  
  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "not_equals":
      return fieldValue !== condition.value;
    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      if (typeof fieldValue === "string") {
        return fieldValue.includes(String(condition.value));
      }
      return false;
    case "not_contains":
      return !evaluateCondition({ ...condition, operator: "contains" }, formData);
    case "greater_than":
      return Number(fieldValue) > Number(condition.value);
    case "less_than":
      return Number(fieldValue) < Number(condition.value);
    case "is_empty":
      return fieldValue === "" || fieldValue === null || fieldValue === undefined || 
             (Array.isArray(fieldValue) && fieldValue.length === 0);
    case "is_not_empty":
      return !evaluateCondition({ ...condition, operator: "is_empty" }, formData);
    case "starts_with":
      return String(fieldValue).startsWith(String(condition.value));
    case "ends_with":
      return String(fieldValue).endsWith(String(condition.value));
    default:
      return false;
  }
}
```

---

### `evaluateConditionGroup`

```ts
/**
 * Evaluates a condition group (AND/OR) against form data.
 * @param group - The condition group to evaluate
 * @param formData - Current form data values
 * @returns true if group conditions are met, false otherwise
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  formData: Record<string, unknown>
): boolean {
  if (group.conditions.length === 0) return true;
  
  if (group.operator === "AND") {
    return group.conditions.every(condition => 
      evaluateCondition(condition, formData)
    );
  } else { // OR
    return group.conditions.some(condition => 
      evaluateCondition(condition, formData)
    );
  }
}
```

---

### `shouldShowField`

```ts
/**
 * Determines if a field should be visible based on its conditional logic.
 * @param field - The field to check
 * @param formData - Current form data values
 * @returns true if field should be shown, false if hidden
 */
export function shouldShowField(
  field: FormField,
  formData: Record<string, unknown>
): boolean {
  if (!field.conditionalLogic) return true;
  
  const { showIf, hideIf } = field.conditionalLogic;
  
  // If hideIf is true, field is hidden
  if (hideIf && evaluateConditionGroup(hideIf, formData)) {
    return false;
  }
  
  // If showIf exists and is false, field is hidden
  if (showIf && !evaluateConditionGroup(showIf, formData)) {
    return false;
  }
  
  return true;
}
```

---

### `getJumpTarget`

```ts
/**
 * Gets the target field ID for a jump based on conditional logic.
 * @param field - The field with jump logic
 * @param formData - Current form data values
 * @returns Target field ID if jump conditions are met, null otherwise
 */
export function getJumpTarget(
  field: FormField,
  formData: Record<string, unknown>
): string | null {
  if (!field.conditionalLogic?.jumpTo) return null;
  
  for (const jump of field.conditionalLogic.jumpTo) {
    if (evaluateConditionGroup(jump.conditions, formData)) {
      return jump.targetFieldId;
    }
  }
  
  return null;
}
```

---

### `getDynamicLabel`

```ts
/**
 * Gets the dynamic label for a field based on conditional logic.
 * @param field - The field with dynamic label logic
 * @param formData - Current form data values
 * @returns Dynamic label if conditions are met, original label otherwise
 */
export function getDynamicLabel(
  field: FormField,
  formData: Record<string, unknown>
): string {
  if (!field.conditionalLogic?.dynamicLabel) return field.label;
  
  for (const dynamic of field.conditionalLogic.dynamicLabel) {
    if (evaluateConditionGroup(dynamic.conditions, formData)) {
      return dynamic.label;
    }
  }
  
  return field.label;
}
```

---

### `applyPiping`

```ts
/**
 * Applies piping (variable substitution) to text using form data.
 * @param text - Text with piping syntax (e.g., "Hello {{fieldId}}")
 * @param formData - Current form data values
 * @param fields - All form fields (for label lookup)
 * @returns Text with piped values substituted
 */
export function applyPiping(
  text: string,
  formData: Record<string, unknown>,
  fields: FormField[]
): string {
  const fieldMap = new Map(fields.map(f => [f.id, f]));
  
  return text.replace(/\{\{(\w+)\}\}/g, (match, fieldId) => {
    const value = formData[fieldId];
    const field = fieldMap.get(fieldId);
    
    if (value === undefined || value === null || value === "") {
      return field?.label || fieldId;
    }
    
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    return String(value);
  });
}
```

---

### `getVisibleFields`

```ts
/**
 * Filters fields to only those that should be visible.
 * @param fields - All form fields
 * @param formData - Current form data values
 * @returns Array of visible fields in original order
 */
export function getVisibleFields(
  fields: FormField[],
  formData: Record<string, unknown>
): FormField[] {
  return fields.filter(field => shouldShowField(field, formData));
}
```

---

### `getNextCardIndex`

```ts
/**
 * Calculates the next card index considering jumps and visibility.
 * @param currentIndex - Current field index in schema
 * @param visibleFields - Currently visible fields
 * @param formData - Current form data values
 * @returns Next visible field index, or -1 if at end
 */
export function getNextCardIndex(
  currentIndex: number,
  visibleFields: FormField[],
  formData: Record<string, unknown>
): number {
  if (visibleFields.length === 0) return -1;
  
  const currentField = visibleFields[currentIndex];
  if (!currentField) return 0;
  
  // Check for jump
  const jumpTarget = getJumpTarget(currentField, formData);
  if (jumpTarget) {
    const jumpIndex = visibleFields.findIndex(f => f.id === jumpTarget);
    if (jumpIndex >= 0) return jumpIndex;
  }
  
  // Default: next visible field
  if (currentIndex < visibleFields.length - 1) {
    return currentIndex + 1;
  }
  
  return -1; // At end
}
```

---

## File 2: `form-validation.ts`

**Purpose**: Validation logic and initial form data generation.

**Imports**: `FormField` from `./types`.

**Exports**:

### `getInitialFormData`

```ts
/**
 * Generates initial form data with default values for all fields.
 * @param schema - Form field schema
 * @returns Object with field IDs as keys and default values
 */
export function getInitialFormData(
  schema: FormField[]
): Record<string, unknown> {
  const initialData: Record<string, unknown> = {};
  
  for (const field of schema) {
    if (field.type === "checkbox") {
      initialData[field.id] = [];
    } else {
      initialData[field.id] = "";
    }
  }
  
  return initialData;
}
```

---

### `validateField`

```ts
/**
 * Validates a single field value.
 * @param field - The field to validate
 * @param value - The value to validate
 * @returns true if valid, false otherwise
 */
export function validateField(
  field: FormField,
  value: unknown
): boolean {
  // Required check
  if (field.required) {
    if (value === "" || value === null || value === undefined) {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
  }
  
  // Type-specific validation
  switch (field.type) {
    case "email":
      if (value && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      }
      return !field.required || value !== "";
      
    case "phone":
      if (value && typeof value === "string") {
        // Basic phone validation (adjust regex as needed)
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(value.replace(/\s/g, ""));
      }
      return !field.required || value !== "";
      
    case "select":
    case "radio":
      if (value && field.options) {
        return field.options.includes(String(value));
      }
      return !field.required || value !== "";
      
    case "checkbox":
      if (Array.isArray(value) && field.options) {
        return value.every(v => field.options!.includes(String(v)));
      }
      return Array.isArray(value);
      
    default:
      return true;
  }
}
```

---

### `validateForm`

```ts
/**
 * Validates all required fields in the form.
 * @param schema - Form field schema
 * @param formData - Current form data values
 * @returns true if all required fields are valid, false otherwise
 */
export function validateForm(
  schema: FormField[],
  formData: Record<string, unknown>
): boolean {
  for (const field of schema) {
    // Only validate visible fields
    if (!shouldShowField(field, formData)) {
      continue;
    }
    
    const value = formData[field.id];
    if (!validateField(field, value)) {
      return false;
    }
  }
  
  return true;
}
```

**Note**: This function imports `shouldShowField` from `conditional-logic.ts`.

---

## File 3: `flowchart-types.ts`

**Purpose**: Type definitions for flowchart representation.

**Imports**: `FormField`, `ConditionGroup` from `./types`; `Node`, `Edge` from `@xyflow/react`.

**Exports**:

```ts
import type { Node, Edge } from "@xyflow/react";
import type { FormField, ConditionGroup } from "./types";

export type FlowchartNodeType = 
  | "start" 
  | "field" 
  | "statement" 
  | "end";

export interface FlowchartNodeData {
  label: string;
  field?: FormField;
  isSuccessCard?: boolean;
  media?: CardMedia; // Re-export or import from types
}

export interface FlowchartEdgeData {
  label?: string;
  condition?: ConditionGroup;
}

export type FlowchartNode = Node<FlowchartNodeData, FlowchartNodeType>;
export type FlowchartEdge = Edge<FlowchartEdgeData>;

export interface FlowchartViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FlowchartGraph {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  viewport?: FlowchartViewport;
}

export const START_NODE_ID = "start";
export const END_NODE_ID = "end";
```

---

## File 4: `flowchart-serialization.ts`

**Purpose**: Convert between flowchart graph and form schema.

**Imports**: `FormField` from `./types`; flowchart types from `./flowchart-types`.

**Exports**:

### `flowchartToSchema`

```ts
/**
 * Converts a flowchart graph to a form field schema.
 * @param graph - The flowchart graph
 * @returns Array of form fields in order
 */
export function flowchartToSchema(graph: FlowchartGraph): FormField[] {
  const schema: FormField[] = [];
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  
  // Start from start node
  const startNode = graph.nodes.find(n => n.type === "start");
  if (!startNode) return schema;
  
  // Traverse graph following edges
  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    // Add field if it's a field node
    if (node.type === "field" && node.data.field) {
      schema.push(node.data.field);
    }
    
    // Follow outgoing edges
    const outgoingEdges = graph.edges.filter(e => e.source === nodeId);
    for (const edge of outgoingEdges) {
      traverse(edge.target);
    }
  }
  
  traverse(startNode.id);
  return schema;
}
```

---

### `schemaToFlowchart`

```ts
/**
 * Converts a form field schema to a flowchart graph.
 * @param schema - Array of form fields
 * @param viewport - Optional viewport settings
 * @returns Flowchart graph representation
 */
export function schemaToFlowchart(
  schema: FormField[],
  viewport?: FlowchartViewport
): FlowchartGraph {
  const nodes: FlowchartNode[] = [
    {
      id: START_NODE_ID,
      type: "start",
      position: { x: 0, y: 0 },
      data: { label: "Start" }
    }
  ];
  
  const edges: FlowchartEdge[] = [];
  
  // Create field nodes
  schema.forEach((field, index) => {
    const nodeId = `field-${field.id}`;
    nodes.push({
      id: nodeId,
      type: "field",
      position: { x: 0, y: (index + 1) * 100 },
      data: {
        label: field.label,
        field: field
      }
    });
    
    // Connect to previous node
    const prevNodeId = index === 0 ? START_NODE_ID : `field-${schema[index - 1].id}`;
    edges.push({
      id: `edge-${prevNodeId}-${nodeId}`,
      source: prevNodeId,
      target: nodeId
    });
  });
  
  // Add end node
  const lastFieldId = schema.length > 0 ? `field-${schema[schema.length - 1].id}` : START_NODE_ID;
  nodes.push({
    id: END_NODE_ID,
    type: "end",
    position: { x: 0, y: (schema.length + 1) * 100 },
    data: { label: "End" }
  });
  
  edges.push({
    id: `edge-${lastFieldId}-${END_NODE_ID}`,
    source: lastFieldId,
    target: END_NODE_ID
  });
  
  return {
    nodes,
    edges,
    viewport: viewport || { x: 0, y: 0, zoom: 1 }
  };
}
```

---

### `mergeFlowchartWithSchema`

```ts
/**
 * Merges a flowchart graph with a schema, updating field nodes.
 * @param graph - Existing flowchart graph
 * @param schema - Form field schema to merge
 * @returns Updated flowchart graph
 */
export function mergeFlowchartWithSchema(
  graph: FlowchartGraph,
  schema: FormField[]
): FlowchartGraph {
  const fieldMap = new Map(schema.map(f => [f.id, f]));
  
  const updatedNodes = graph.nodes.map(node => {
    if (node.type === "field" && node.data.field) {
      const updatedField = fieldMap.get(node.data.field.id);
      if (updatedField) {
        return {
          ...node,
          data: {
            ...node.data,
            field: updatedField,
            label: updatedField.label
          }
        };
      }
    }
    return node;
  });
  
  return {
    ...graph,
    nodes: updatedNodes
  };
}
```

---

## File 5: `profile-estimation.ts`

**Purpose**: Profile calculation logic (rule-based and AI).

**Imports**: `ProfileEstimation`, `FieldScoring`, `FormField`, etc. from `./types`; `evaluateCondition` from `./conditional-logic`.

**Exports**:

### `calculatePercentageScore`

```ts
/**
 * Calculates percentage-based profile score.
 * @param config - Percentage configuration
 * @param answers - Form answers
 * @param fields - All form fields
 * @returns Score result with percentage and range
 */
export function calculatePercentageScore(
  config: ProfileEstimation["percentageConfig"],
  answers: Record<string, unknown>,
  fields: FormField[]
): { score: number; range: { min: number; max: number; label: string; description: string } } | null {
  if (!config) return null;
  
  let totalScore = 0;
  let maxScore = 0;
  
  // Calculate scores from field scoring
  if (config.fieldScoring) {
    for (const fieldScoring of config.fieldScoring) {
      const field = fields.find(f => f.id === fieldScoring.fieldId);
      if (!field) continue;
      
      const answer = answers[fieldScoring.fieldId];
      const scoring = fieldScoring.scoring.find(s => s.answer === answer);
      
      if (scoring) {
        totalScore += scoring.points;
        maxScore += Math.max(...fieldScoring.scoring.map(s => s.points));
      }
    }
  }
  
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  
  // Find matching range
  const range = config.ranges.find(
    r => percentage >= r.min && percentage <= r.max
  ) || config.ranges[0];
  
  return { score: percentage, range };
}
```

---

### `matchCategory`

```ts
/**
 * Matches answers to a category based on scoring rules.
 * @param config - Category configuration
 * @param answers - Form answers
 * @param fields - All form fields
 * @returns Matched category or null
 */
export function matchCategory(
  config: ProfileEstimation["categoryConfig"],
  answers: Record<string, unknown>,
  fields: FormField[]
): { id: string; name: string; description: string } | null {
  if (!config) return null;
  
  for (const category of config.categories) {
    const allMatch = category.matchingLogic.every(rule => {
      const field = fields.find(f => f.id === rule.fieldId);
      if (!field) return false;
      
      const answer = answers[rule.fieldId];
      return evaluateCondition(
        {
          fieldId: rule.fieldId,
          operator: rule.operator as ConditionOperator,
          value: rule.value
        },
        answers
      );
    });
    
    if (allMatch) {
      return {
        id: category.id,
        name: category.name,
        description: category.description
      };
    }
  }
  
  return null;
}
```

---

### `calculateProfileEstimation`

```ts
/**
 * Main entry point for profile estimation calculation.
 * @param config - Profile estimation configuration
 * @param answers - Form answers
 * @param fields - All form fields
 * @returns Profile result or null
 */
export function calculateProfileEstimation(
  config: ProfileEstimation,
  answers: Record<string, unknown>,
  fields: FormField[]
): { type: string; result: Record<string, unknown> } | null {
  if (!config.enabled) return null;
  
  switch (config.type) {
    case "percentage":
      const percentageResult = calculatePercentageScore(config.percentageConfig, answers, fields);
      if (!percentageResult) return null;
      return {
        type: "percentage",
        result: {
          score: percentageResult.score,
          range: percentageResult.range
        }
      };
      
    case "category":
      const categoryResult = matchCategory(config.categoryConfig, answers, fields);
      if (!categoryResult) return null;
      return {
        type: "category",
        result: categoryResult
      };
      
    // Add other types as needed
    default:
      return null;
  }
}
```

**Note**: AI-based profile estimation is handled by the service layer (API call), not the domain layer.

---

## File 6: `navigation.ts` (Optional)

**Purpose**: Navigation-specific utilities.

**Exports**:

### `clampToVisible`

```ts
/**
 * Clamps current index to the nearest visible field index.
 * If current field is hidden, returns the next visible field index (forward bias).
 * @param schema - All form fields
 * @param visibleFields - Currently visible fields
 * @param currentIndex - Current field index in schema
 * @returns Clamped visible index
 */
export function clampToVisible(
  schema: FormField[],
  visibleFields: FormField[],
  currentIndex: number
): number {
  if (visibleFields.length === 0) return 0;
  
  const currentField = schema[currentIndex];
  if (currentField && visibleFields.some(f => f.id === currentField.id)) {
    return visibleFields.findIndex(f => f.id === currentField.id);
  }
  
  // Forward bias: find next visible field after currentIndex
  const nextVisible = visibleFields.findIndex(f => {
    const schemaIndex = schema.findIndex(s => s.id === f.id);
    return schemaIndex >= currentIndex;
  });
  
  return nextVisible >= 0 ? nextVisible : 0;
}
```

---

## Testing Requirements

Each domain function should have unit tests:

- **conditional-logic.ts**: Test all operators, AND/OR logic, visibility, jumps, piping
- **form-validation.ts**: Test initial data generation, field validation, form validation
- **flowchart-serialization.ts**: Test conversion both ways, merge logic
- **profile-estimation.ts**: Test percentage calculation, category matching
- **navigation.ts**: Test clamping logic

**Test Structure**:
```ts
describe('evaluateCondition', () => {
  it('should evaluate equals correctly', () => {
    // Test cases
  });
  // More tests...
});
```

---

## Implementation Checklist

- [ ] Create `conditional-logic.ts` with all functions
- [ ] Create `form-validation.ts` with validation functions
- [ ] Create `flowchart-types.ts` with flowchart types
- [ ] Create `flowchart-serialization.ts` with conversion functions
- [ ] Create `profile-estimation.ts` with calculation functions
- [ ] Create `navigation.ts` with navigation utilities (if needed)
- [ ] Ensure all files import only from `./types`
- [ ] Write unit tests for each function
- [ ] Verify no React or API dependencies

---

## Summary

**Domain Layer Characteristics**:
- ✅ Pure functions only
- ✅ No React dependencies
- ✅ No API calls
- ✅ Import only from `./types`
- ✅ Testable in isolation

**Files**:
1. `conditional-logic.ts` - Visibility, conditions, jumps, piping
2. `form-validation.ts` - Validation and initial data
3. `flowchart-types.ts` - Flowchart type definitions
4. `flowchart-serialization.ts` - Schema ↔ flowchart conversion
5. `profile-estimation.ts` - Profile calculation
6. `navigation.ts` - Navigation utilities (optional)

---

## Next Steps

1. Implement domain functions following this guide
2. Write unit tests for each function
3. Verify no React/API dependencies
4. Proceed to `06-service-layer.md` for API client updates
