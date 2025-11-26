# Testing Guide

This document outlines the testing infrastructure and how to write and run tests.

## Testing Stack

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Jest coverage reports

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

## Test Structure

```
src/
  __tests__/
    components/     # Component tests
    hooks/          # Hook tests
    lib/            # Utility function tests
    integration/    # Integration tests
    utils/          # Test utilities
e2e/                # E2E tests
```

## Writing Tests

### Unit Tests

#### Testing Components

```typescript
import { render, screen } from '@/__tests__/utils/test-utils';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/use-my-hook';

describe('useMyHook', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });
});
```

#### Testing Utilities

```typescript
import { myUtility } from '@/lib/my-utility';

describe('myUtility', () => {
  it('should process input correctly', () => {
    const result = myUtility('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Tests

#### Testing Firebase Operations

```typescript
import { createNotification } from '@/lib/notifications';

describe('Firebase Operations', () => {
  it('should create a notification', async () => {
    const notification = {
      userId: 'test-user',
      type: 'like',
      title: 'New Like',
      message: 'Someone liked your post',
    };
    
    await expect(createNotification(notification)).resolves.not.toThrow();
  });
});
```

#### Testing Form Submissions

```typescript
import { render, screen } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';

describe('Form Submission', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<MyForm />);
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can complete critical flow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: /communities/i }).click();
  await expect(page).toHaveURL(/.*communities/);
});
```

## Test Utilities

### Custom Render

Use the custom render from test-utils to include all providers:

```typescript
import { render } from '@/__tests__/utils/test-utils';

render(<MyComponent />);
```

### Mock Data

Use mock data from test-utils:

```typescript
import { mockUser, mockPost } from '@/__tests__/utils/test-utils';
```

### Firebase Mocks

Use Firebase mocks for testing:

```typescript
import { mockFirestore, mockAuth } from '@/__tests__/utils/firebase-mocks';
```

## Best Practices

1. **Test Behavior, Not Implementation**: Test what users see and do, not internal implementation details.

2. **Use Accessible Queries**: Prefer `getByRole`, `getByLabelText`, etc. over `getByTestId`.

3. **Keep Tests Isolated**: Each test should be independent and not rely on other tests.

4. **Mock External Dependencies**: Mock Firebase, API calls, and other external services.

5. **Test Error Cases**: Don't just test happy paths; test error handling too.

6. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.

7. **Arrange-Act-Assert**: Structure tests with clear sections.

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Before deployment
- On every commit (optional)

## Firebase Emulator (Optional)

For more realistic integration tests, you can use Firebase Emulator:

```bash
# Install Firebase tools
npm install -g firebase-tools

# Start emulator
firebase emulators:start
```

Then configure tests to use emulator endpoints.

