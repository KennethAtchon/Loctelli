# Testing Migration Guide

## Overview

This guide covers migrating the testing infrastructure, including Jest configuration, React Testing Library setup, test utilities, and all test files.

## Testing Stack

### Current Testing Stack

- **Test Framework**: Jest 29.7.0
- **React Testing**: @testing-library/react 16.1.0
- **DOM Testing**: @testing-library/jest-dom 6.6.3
- **User Events**: @testing-library/user-event 14.5.2
- **Mocking**: MSW (Mock Service Worker) 2.3.5
- **Environment**: jest-environment-jsdom

## 1. Jest Configuration

### File: `jest.config.js`

#### Current Configuration Review

Review for:
- Test environment
- Module name mapping
- Setup files
- Transform configuration
- Coverage settings
- Test match patterns

#### Migration Steps

**1. Update Jest Configuration**

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // ... other config
};
```

- [ ] Verify test environment
- [ ] Check module name mapping
- [ ] Verify setup files
- [ ] Test configuration

**2. Jest 29 Updates**

- [ ] Review Jest 29 changelog
- [ ] Check for breaking changes
- [ ] Update configuration if needed
- [ ] Test Jest execution

**3. TypeScript Support**

- [ ] Verify TypeScript compilation
- [ ] Check transform configuration
- [ ] Test type checking in tests
- [ ] Verify type imports

## 2. Jest Setup File

### File: `jest.setup.js`

#### Current Setup

Provides:
- Testing Library DOM matchers
- MSW setup (if used)
- Global test utilities
- Mock configurations

#### Migration Steps

**1. Update Setup File**

- [ ] Verify `@testing-library/jest-dom` import
- [ ] Check MSW setup (if used)
- [ ] Review global mocks
- [ ] Test setup execution

**2. Testing Library Updates**

- [ ] Update jest-dom matchers
- [ ] Check for new matchers
- [ ] Verify deprecated matchers
- [ ] Test matcher usage

**3. MSW Configuration**

- [ ] Verify MSW setup
- [ ] Check handler configuration
- [ ] Test API mocking
- [ ] Verify request interception

#### Example: Setup File

```javascript
import '@testing-library/jest-dom';
import { server } from './test-utils/msw';

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 3. Test Utilities

### Location: `test-utils/`

#### Files

- `test-utils.tsx` - Test utilities and helpers

#### Migration Steps

**1. Review Test Utilities**

- [ ] Verify utility functions
- [ ] Check helper components
- [ ] Test utility exports
- [ ] Verify type safety

**2. React Query Testing**

- [ ] Verify QueryClient provider
- [ ] Check test query client setup
- [ ] Test query mocking
- [ ] Verify query invalidation

**3. Context Testing**

- [ ] Verify context providers
- [ ] Check mock contexts
- [ ] Test context utilities
- [ ] Verify context isolation

#### Example: Test Utilities

```typescript
export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

## 4. MSW (Mock Service Worker)

### MSW Setup

#### Migration Steps

**1. MSW Configuration**

- [ ] Verify MSW version compatibility
- [ ] Check handler setup
- [ ] Test request interception
- [ ] Verify response mocking

**2. API Handlers**

- [ ] Review all API handlers
- [ ] Check handler patterns
- [ ] Test handler matching
- [ ] Verify error responses

**3. MSW v2 Updates**

- [ ] Review MSW v2 migration guide
- [ ] Check for breaking changes
- [ ] Update handlers if needed
- [ ] Test MSW execution

#### Example: MSW Handler

```typescript
export const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({ users: [] }));
  }),
];
```

## 5. Component Tests

### Location: `__tests__/`

#### Test Files

- `contexts/auth-context.test.tsx`
- `lib/api/client.test.ts`
- `lib/api/endpoints/*.test.ts`
- `lib/utils.test.ts`

#### Migration Steps

**1. Update Component Tests**

- [ ] Verify test file structure
- [ ] Check test descriptions
- [ ] Test component rendering
- [ ] Verify user interactions

**2. React Testing Library Updates**

- [ ] Review Testing Library v16 changes
- [ ] Update query methods if needed
- [ ] Check async utilities
- [ ] Verify waitFor usage

**3. React 19 Compatibility**

- [ ] Verify tests work with React 19
- [ ] Check for deprecated APIs
- [ ] Test component updates
- [ ] Verify event handling

#### Example: Component Test

```typescript
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<Component />);
    await user.click(screen.getByRole('button'));
    // Verify interaction
  });
});
```

## 6. API Client Tests

### Location: `__tests__/lib/api/`

#### Migration Steps

**1. API Client Tests**

- [ ] Verify API client mocking
- [ ] Check request/response testing
- [ ] Test error handling
- [ ] Verify token refresh

**2. Endpoint Tests**

- [ ] Review endpoint test files
- [ ] Check endpoint mocking
- [ ] Test endpoint methods
- [ ] Verify response handling

**3. Auth Service Tests**

- [ ] Verify auth service tests
- [ ] Check token management
- [ ] Test cookie handling
- [ ] Verify refresh logic

## 7. Context Tests

### Location: `__tests__/contexts/`

#### Migration Steps

**1. Auth Context Tests**

- [ ] Verify context provider testing
- [ ] Check context value testing
- [ ] Test context updates
- [ ] Verify error handling

**2. Context Mocking**

- [ ] Verify context mocks
- [ ] Check mock providers
- [ ] Test context isolation
- [ ] Verify context state

## 8. User Event Testing

### @testing-library/user-event v14

#### Migration Steps

**1. User Event Updates**

- [ ] Review user-event v14 changes
- [ ] Update event methods
- [ ] Check async handling
- [ ] Test user interactions

**2. Event Methods**

- [ ] Verify click events
- [ ] Check input events
- [ ] Test keyboard events
- [ ] Verify form events

#### Example: User Event

```typescript
import userEvent from '@testing-library/user-event';

it('handles user input', async () => {
  const user = userEvent.setup();
  render(<Input />);
  await user.type(screen.getByRole('textbox'), 'text');
  // Verify input
});
```

## 9. Test Coverage

### Coverage Configuration

#### Migration Steps

**1. Coverage Setup**

- [ ] Verify coverage configuration
- [ ] Check coverage thresholds
- [ ] Test coverage reporting
- [ ] Verify coverage collection

**2. Coverage Goals**

- [ ] Review coverage targets
- [ ] Check coverage reports
- [ ] Identify uncovered areas
- [ ] Plan coverage improvements

#### Coverage Commands

```bash
# Run coverage
pnpm test:coverage

# Check coverage thresholds
# Review coverage reports
```

## 10. Snapshot Testing

### Snapshot Tests (if any)

#### Migration Steps

- [ ] Review snapshot tests
- [ ] Update snapshots if needed
- [ ] Verify snapshot updates
- [ ] Test snapshot matching

## 11. E2E Testing (if applicable)

### E2E Test Setup

#### Migration Steps

- [ ] Review E2E test setup
- [ ] Check E2E test framework
- [ ] Test E2E execution
- [ ] Verify E2E coverage

## 12. Test Performance

### Performance Optimization

#### Migration Steps

- [ ] Review test execution time
- [ ] Identify slow tests
- [ ] Optimize test setup
- [ ] Check test parallelization

## 13. Migration Checklist

After testing migration, verify:

- [ ] All tests pass
- [ ] Test configuration works
- [ ] MSW setup works
- [ ] Component tests work
- [ ] API tests work
- [ ] Context tests work
- [ ] Coverage reporting works
- [ ] Test utilities work
- [ ] No flaky tests
- [ ] Test performance acceptable

## 14. Common Testing Issues

### Issue: Tests Failing After Update

**Solution:**
1. Review dependency changelogs
2. Check for breaking changes
3. Update test utilities
4. Verify mock setup

### Issue: MSW Not Intercepting

**Solution:**
1. Verify MSW setup
2. Check handler registration
3. Test handler matching
4. Verify request URLs

### Issue: Async Test Failures

**Solution:**
1. Check async/await usage
2. Verify waitFor usage
3. Test timeout settings
4. Check test cleanup

### Issue: Type Errors in Tests

**Solution:**
1. Update type definitions
2. Check test type imports
3. Verify TypeScript config
4. Test type checking

## 15. Test Best Practices

### Testing Guidelines

- [ ] Write descriptive test names
- [ ] Test user behavior, not implementation
- [ ] Use appropriate queries
- [ ] Test error cases
- [ ] Verify accessibility
- [ ] Keep tests isolated
- [ ] Clean up after tests
- [ ] Mock external dependencies

## Next Steps

After testing migration:
- **[08-build-deployment-migration.md](./08-build-deployment-migration.md)** - Migrate build and deployment

## Notes

Document testing changes:

```
[Add testing migration notes here]
```

