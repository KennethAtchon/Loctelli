# Testing Recommendations

> **Purpose**: Testing strategy and recommendations for the refactored form system.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: All previous documents

---

## Overview

This document provides testing recommendations for the refactored form system. Tests should be written incrementally as each component is implemented.

---

## Testing Strategy

**Three Levels**:
1. **Unit Tests** - Domain functions and hooks
2. **Integration Tests** - Form flows and API interactions
3. **E2E Tests** - Full user flows (optional)

---

## Unit Tests — Domain Layer

**Location**: `__tests__/lib/forms/*.test.ts`

**Tools**: Jest, Vitest, or similar

---

### Conditional Logic Tests

**File**: `__tests__/lib/forms/conditional-logic.test.ts`

**Test Cases**:

```ts
describe('evaluateCondition', () => {
  it('should evaluate equals correctly', () => {
    expect(evaluateCondition(
      { fieldId: 'name', operator: 'equals', value: 'John' },
      { name: 'John' }
    )).toBe(true);
    
    expect(evaluateCondition(
      { fieldId: 'name', operator: 'equals', value: 'John' },
      { name: 'Jane' }
    )).toBe(false);
  });
  
  it('should evaluate contains correctly', () => {
    expect(evaluateCondition(
      { fieldId: 'tags', operator: 'contains', value: 'urgent' },
      { tags: ['urgent', 'important'] }
    )).toBe(true);
  });
  
  // Test all operators
});

describe('shouldShowField', () => {
  it('should show field when no conditional logic', () => {
    const field: FormField = { id: '1', type: 'text', label: 'Name' };
    expect(shouldShowField(field, {})).toBe(true);
  });
  
  it('should hide field when hideIf condition is met', () => {
    const field: FormField = {
      id: '1',
      type: 'text',
      label: 'Name',
      conditionalLogic: {
        hideIf: {
          operator: 'AND',
          conditions: [{ fieldId: 'showName', operator: 'equals', value: false }]
        }
      }
    };
    expect(shouldShowField(field, { showName: false })).toBe(false);
  });
  
  // More test cases
});

describe('getVisibleFields', () => {
  it('should filter hidden fields', () => {
    const fields: FormField[] = [
      { id: '1', type: 'text', label: 'Name' },
      {
        id: '2',
        type: 'text',
        label: 'Email',
        conditionalLogic: {
          hideIf: {
            operator: 'AND',
            conditions: [{ fieldId: 'showEmail', operator: 'equals', value: false }]
          }
        }
      }
    ];
    
    const visible = getVisibleFields(fields, { showEmail: false });
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('1');
  });
});
```

---

### Form Validation Tests

**File**: `__tests__/lib/forms/form-validation.test.ts`

**Test Cases**:

```ts
describe('getInitialFormData', () => {
  it('should initialize checkbox fields as arrays', () => {
    const schema: FormField[] = [
      { id: '1', type: 'checkbox', label: 'Options', options: ['A', 'B'] }
    ];
    const data = getInitialFormData(schema);
    expect(data['1']).toEqual([]);
  });
  
  it('should initialize other fields as empty strings', () => {
    const schema: FormField[] = [
      { id: '1', type: 'text', label: 'Name' }
    ];
    const data = getInitialFormData(schema);
    expect(data['1']).toBe('');
  });
});

describe('validateField', () => {
  it('should validate required fields', () => {
    const field: FormField = {
      id: '1',
      type: 'text',
      label: 'Name',
      required: true
    };
    expect(validateField(field, '')).toBe(false);
    expect(validateField(field, 'John')).toBe(true);
  });
  
  it('should validate email format', () => {
    const field: FormField = {
      id: '1',
      type: 'email',
      label: 'Email'
    };
    expect(validateField(field, 'invalid')).toBe(false);
    expect(validateField(field, 'test@example.com')).toBe(true);
  });
  
  // More test cases
});

describe('validateForm', () => {
  it('should validate all required fields', () => {
    const schema: FormField[] = [
      { id: '1', type: 'text', label: 'Name', required: true },
      { id: '2', type: 'email', label: 'Email', required: true }
    ];
    expect(validateForm(schema, { '1': 'John', '2': 'test@example.com' })).toBe(true);
    expect(validateForm(schema, { '1': 'John' })).toBe(false);
  });
});
```

---

### Profile Estimation Tests

**File**: `__tests__/lib/forms/profile-estimation.test.ts`

**Test Cases**:

```ts
describe('calculatePercentageScore', () => {
  it('should calculate percentage score correctly', () => {
    const config = {
      title: 'Score',
      fieldScoring: [
        {
          fieldId: 'q1',
          scoring: [
            { answer: 'yes', points: 10 },
            { answer: 'no', points: 0 }
          ]
        }
      ],
      ranges: [
        { min: 0, max: 50, label: 'Low', description: 'Low score' },
        { min: 51, max: 100, label: 'High', description: 'High score' }
      ]
    };
    
    const result = calculatePercentageScore(config, { q1: 'yes' }, []);
    expect(result?.score).toBe(100);
    expect(result?.range.label).toBe('High');
  });
});

describe('matchCategory', () => {
  it('should match category when all conditions are met', () => {
    const config = {
      title: 'Categories',
      categories: [
        {
          id: 'cat1',
          name: 'Category 1',
          description: 'Desc',
          matchingLogic: [
            { fieldId: 'q1', operator: 'equals', value: 'yes' }
          ]
        }
      ]
    };
    
    const result = matchCategory(config, { q1: 'yes' }, []);
    expect(result?.id).toBe('cat1');
  });
});
```

---

## Unit Tests — Hooks

**Location**: `__tests__/components/public/forms/card-form/*.test.ts`

**Tools**: React Testing Library, `@testing-library/react-hooks` (if using older version)

---

### Hook Testing Setup

```ts
import { renderHook, act } from '@testing-library/react';
import { useCardFormSchema } from '@/components/public/forms/card-form/useCardFormSchema';

describe('useCardFormSchema', () => {
  it('should derive schema from flowchart', () => {
    const template: FormTemplate = {
      id: '1',
      slug: 'test',
      name: 'Test',
      formType: 'card',
      cardSettings: {
        flowchartGraph: {
          nodes: [/* ... */],
          edges: [/* ... */]
        }
      }
    };
    
    const { result } = renderHook(() => useCardFormSchema(template));
    expect(result.current.schema).toBeDefined();
  });
});
```

---

### Navigation Hook Tests

**File**: `__tests__/components/public/forms/card-form/useCardFormNavigation.test.ts`

**Test Cases**:

```ts
describe('useCardFormNavigation', () => {
  it('should clamp index when current field becomes hidden', () => {
    const schema: FormField[] = [
      { id: '1', type: 'text', label: 'Name' },
      {
        id: '2',
        type: 'text',
        label: 'Email',
        conditionalLogic: {
          hideIf: {
            operator: 'AND',
            conditions: [{ fieldId: 'showEmail', operator: 'equals', value: false }]
          }
        }
      }
    ];
    
    const { result, rerender } = renderHook(
      ({ formData, currentIndex }) => useCardFormNavigation(schema, formData, currentIndex, jest.fn()),
      { initialProps: { formData: { showEmail: true }, currentIndex: 1 } }
    );
    
    expect(result.current.currentVisibleIndex).toBe(1);
    
    // Hide email field
    rerender({ formData: { showEmail: false }, currentIndex: 1 });
    
    // Should clamp to 0 (first visible field)
    expect(result.current.currentVisibleIndex).toBe(0);
  });
});
```

---

### State Hook Tests

**File**: `__tests__/components/public/forms/card-form/useCardFormState.test.ts`

**Test Cases**:

```ts
describe('useCardFormState', () => {
  it('should initialize with default state', () => {
    const template: FormTemplate = { /* ... */ };
    const { result } = renderHook(() => useCardFormState('test', template));
    
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.formError).toBeNull();
  });
  
  it('should handle goNext action', async () => {
    const template: FormTemplate = { /* ... */ };
    const { result } = renderHook(() => useCardFormState('test', template));
    
    await act(async () => {
      result.current.goNext();
    });
    
    expect(result.current.currentIndex).toBeGreaterThan(0);
  });
  
  // More test cases
});
```

---

## Integration Tests

**Location**: `__tests__/integration/forms/*.test.ts`

**Tools**: React Testing Library, MSW (Mock Service Worker)

---

### Form Flow Tests

**File**: `__tests__/integration/forms/card-form-flow.test.ts`

**Test Cases**:

```ts
import { render, screen, waitFor } from '@testing-library/react';
import { CardFormContainer } from '@/components/public/forms/card-form';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Card Form Flow', () => {
  it('should render form and allow navigation', async () => {
    server.use(
      rest.get('/api/forms/test', (req, res, ctx) => {
        return res(ctx.json({
          id: '1',
          slug: 'test',
          name: 'Test',
          formType: 'card',
          schema: [
            { id: '1', type: 'text', label: 'Name', required: true },
            { id: '2', type: 'email', label: 'Email', required: true }
          ]
        }));
      })
    );
    
    render(<CardFormContainer slug="test" />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Fill first field
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    // Go to next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should show second field
    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });
  
  it('should submit form successfully', async () => {
    // Test submission flow
  });
});
```

---

### Simple Form Tests

**File**: `__tests__/integration/forms/simple-form-flow.test.ts`

**Test Cases**:

```ts
describe('Simple Form Flow', () => {
  it('should render all fields at once', async () => {
    // Test simple form rendering
  });
  
  it('should validate and submit form', async () => {
    // Test validation and submission
  });
});
```

---

## Component Tests

**Location**: `__tests__/components/public/forms/**/*.test.tsx`

---

### FieldRenderer Tests

**File**: `__tests__/components/public/forms/shared/FieldRenderer.test.tsx`

**Test Cases**:

```ts
describe('FieldRenderer', () => {
  it('should render text input in simple mode', () => {
    const field: FormField = {
      id: '1',
      type: 'text',
      label: 'Name'
    };
    
    render(
      <FieldRenderer
        field={field}
        value=""
        onChange={jest.fn()}
        mode="simple"
      />
    );
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
  
  it('should render media in card mode', () => {
    const field: FormField = {
      id: '1',
      type: 'text',
      label: 'Name',
      media: {
        type: 'image',
        url: '/test.jpg',
        position: 'above'
      }
    };
    
    render(
      <FieldRenderer
        field={field}
        value=""
        onChange={jest.fn()}
        mode="card"
      />
    );
    
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
  
  // More test cases
});
```

---

## E2E Tests (Optional)

**Location**: `e2e/forms/*.spec.ts`

**Tools**: Playwright, Cypress, or similar

**Test Cases**:
- Complete card form flow
- Complete simple form flow
- Form submission
- File uploads
- Profile calculation
- Analytics tracking

---

## Testing Checklist

### Domain Layer
- [ ] `evaluateCondition` - all operators
- [ ] `evaluateConditionGroup` - AND/OR logic
- [ ] `shouldShowField` - visibility logic
- [ ] `getJumpTarget` - jump logic
- [ ] `getDynamicLabel` - dynamic labels
- [ ] `applyPiping` - piping substitution
- [ ] `getVisibleFields` - filtering
- [ ] `getNextCardIndex` - navigation
- [ ] `getInitialFormData` - initialization
- [ ] `validateField` - all field types
- [ ] `validateForm` - form validation
- [ ] `calculatePercentageScore` - percentage calculation
- [ ] `matchCategory` - category matching
- [ ] `flowchartToSchema` - conversion
- [ ] `schemaToFlowchart` - conversion

### Hooks
- [ ] `useCardFormSchema` - schema derivation
- [ ] `useCardFormSession` - session management
- [ ] `useCardFormNavigation` - navigation logic
- [ ] `useCardFormData` - form data management
- [ ] `useCardFormProfile` - profile calculation
- [ ] `useCardFormState` - orchestrator
- [ ] `useSimpleFormState` - simple form state

### Components
- [ ] `FieldRenderer` - all field types, both modes
- [ ] `CardFormView` - rendering, navigation, submission
- [ ] `SimpleFormView` - rendering, submission

### Integration
- [ ] Card form flow
- [ ] Simple form flow
- [ ] Form submission
- [ ] File uploads
- [ ] Profile calculation
- [ ] Analytics tracking

---

## Mocking Strategy

**API Calls**: Use MSW (Mock Service Worker) for API mocking

**Example**:

```ts
import { rest } from 'msw';

server.use(
  rest.get('/api/forms/:slug', (req, res, ctx) => {
    return res(ctx.json({
      id: '1',
      slug: req.params.slug,
      name: 'Test Form',
      formType: 'card',
      schema: []
    }));
  })
);
```

---

## Coverage Goals

**Domain Layer**: 100% coverage (pure functions, easy to test)

**Hooks**: 80%+ coverage (test main flows and edge cases)

**Components**: 70%+ coverage (test rendering and interactions)

**Integration**: 60%+ coverage (test main user flows)

---

## Summary

**Testing Levels**:
1. **Unit Tests** - Domain functions and hooks
2. **Integration Tests** - Form flows
3. **E2E Tests** - Full user flows (optional)

**Key Areas**:
- Domain functions (conditional logic, validation, profile)
- Hooks (state management, effects)
- Components (rendering, interactions)
- Integration (form flows, API)

**Tools**:
- Jest/Vitest for unit tests
- React Testing Library for component tests
- MSW for API mocking
- Playwright/Cypress for E2E (optional)

---

## Next Steps

1. Set up testing infrastructure
2. Write tests incrementally as you implement
3. Aim for high coverage on domain layer
4. Test hooks thoroughly
5. Test integration flows
6. Review `12-implementation-order.md` to start implementation
