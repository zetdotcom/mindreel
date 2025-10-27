# Testing Infrastructure

## Overview
This directory contains the testing infrastructure for MindReel, including unit tests, integration tests, and end-to-end tests.

## Directory Structure

```
src/tests/
├── setup.ts              # Global test setup and mocks
├── unit/                 # Unit tests for individual components and functions
├── integration/          # Integration tests for IPC handlers and API interactions
├── e2e/                  # End-to-end tests using Playwright
├── mocks/                # Mock factories and utilities
├── fixtures/             # Test data and fixtures
└── utils/                # Test utilities and helpers
```

## Test Scripts

- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:run` - Run all tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:e2e:debug` - Debug E2E tests

## Writing Tests

### Unit Tests

Place unit tests next to the files they test with `.test.ts` or `.spec.ts` extension:

```typescript
// src/sqlite/dateUtils.test.ts
import { describe, it, expect } from 'vitest'
import { getWeekKey } from './dateUtils'

describe('getWeekKey', () => {
  it('should return correct week key', () => {
    const date = new Date('2025-10-27')
    expect(getWeekKey(date)).toBe('2025-W43')
  })
})
```

### Component Tests

```typescript
import { render, screen } from '@/tests/utils/testUtils'
import { Button } from './Button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### E2E Tests

```typescript
// src/tests/e2e/auth.e2e.ts
import { test, expect } from '@playwright/test'

test('user can register', async ({ page }) => {
  // Test implementation
})
```

## Mocks and Fixtures

Use the provided mock factories and fixtures for consistent test data:

```typescript
import { mockEntry, mockUser } from '@/tests/fixtures/mockData'
import { createMockSupabaseClient } from '@/tests/mocks/mockFactories'
```

## Coverage Thresholds

Minimum coverage requirements:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%
