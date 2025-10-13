# MindReel Edge Function API Client

A comprehensive TypeScript client library for integrating with MindReel's weekly summary generation edge functions. Provides type-safe API calls, automatic retry logic, validation, and React hooks.

## 🚀 Quick Start

### Installation

The API client is included with the MindReel application. Import it from:

```typescript
import { EdgeFunctionClient, useWeeklySummary } from '@/lib/api';
```

### Basic Usage

```typescript
import { EdgeFunctionClient } from '@/lib/api';

// Create client instance
const client = new EdgeFunctionClient({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key'
});

// Generate weekly summary
const response = await client.generateWeeklySummary({
  week_start: '2025-02-10', // Monday
  week_end: '2025-02-16',   // Sunday
  entries: [
    {
      timestamp: '2025-02-10T09:12:00.000Z',
      text: 'Completed authentication refactoring'
    },
    {
      timestamp: '2025-02-11T14:30:00.000Z',
      text: 'Fixed critical payment system bug'
    }
  ],
  language: 'en'
}, authToken);

console.log(response.summary); // AI-generated summary
console.log(response.remaining); // Remaining quota
```

## 📖 API Reference

### EdgeFunctionClient

Main client class for interacting with edge functions.

#### Constructor

```typescript
new EdgeFunctionClient(config: EdgeFunctionClientConfig)
```

**Config Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `supabaseUrl` | string | Yes | - | Supabase project URL |
| `supabaseAnonKey` | string | Yes | - | Supabase anonymous key |
| `timeout` | number | No | 30000 | Request timeout in ms |
| `retryAttempts` | number | No | 3 | Number of retry attempts |
| `retryDelay` | number | No | 1000 | Base retry delay in ms |

#### Methods

##### `generateWeeklySummary(request, authToken, options?)`

Generates an AI-powered weekly summary.

**Parameters:**
- `request: WeeklySummaryRequest` - The summary request
- `authToken: string` - JWT authentication token
- `options?: RequestOptions` - Optional request configuration

**Returns:** `Promise<WeeklySummarySuccessResponse>`

**Throws:** `EdgeFunctionError` for API errors, `NetworkError` for network issues

##### `validateRequest(request)`

Validates a request without sending it to the server.

**Returns:** `{ valid: boolean; errors: string[] }`

##### `getQuotaInfo()`

Gets quota information from the last successful response.

**Returns:** `QuotaInfo | null`

##### `setAuthenticated(userId)` / `setUnauthenticated()`

Updates client authentication status for better error handling and status tracking.

### Request/Response Types

#### WeeklySummaryRequest

```typescript
interface WeeklySummaryRequest {
  week_start: string;        // Monday in YYYY-MM-DD format
  week_end: string;          // Sunday in YYYY-MM-DD format
  entries: Entry[];          // Array of time-stamped entries
  language?: 'pl' | 'en';    // Optional language preference
  client_meta?: {            // Optional client metadata
    app_version?: string;
    timezone?: string;
    locale?: string;
  };
}
```

#### Entry

```typescript
interface Entry {
  timestamp: string;  // ISO 8601 timestamp
  text: string;       // Entry content
}
```

#### WeeklySummarySuccessResponse

```typescript
interface WeeklySummarySuccessResponse {
  ok: true;
  summary: string;    // AI-generated summary in bullet points
  remaining: number;  // Remaining quota for current cycle
  cycle_end: string;  // ISO timestamp of cycle end
}
```

#### EdgeFunctionError

```typescript
class EdgeFunctionError extends Error {
  reason: 'auth_error' | 'validation_error' | 'quota_exceeded' | 'provider_error' | 'other_error';
  response?: WeeklySummaryErrorResponse;
  retryable: boolean;
}
```

## 🎣 React Hooks

### useWeeklySummary

Primary hook for generating weekly summaries in React components.

```typescript
import { useWeeklySummary } from '@/lib/api';

function WeeklySummaryComponent() {
  const {
    loading,
    error,
    data,
    quota,
    generateSummary,
    clearError,
    reset
  } = useWeeklySummary({
    client: edgeFunctionClient,
    authToken: userToken,
    onSuccess: (data) => console.log('Summary generated!', data),
    onError: (error) => console.error('Generation failed:', error)
  });

  const handleGenerate = async () => {
    await generateSummary({
      week_start: '2025-02-10',
      week_end: '2025-02-16',
      entries: weekEntries,
      language: 'en'
    });
  };

  if (loading) return <div>Generating summary...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (data) return <div>{data.summary}</div>;

  return <button onClick={handleGenerate}>Generate Summary</button>;
}
```

### useWeeklySummaryComplete

Comprehensive hook that combines all functionality.

```typescript
const {
  // Summary generation
  loading,
  error,
  data,
  generateSummary,
  
  // Quota management
  quota,
  isQuotaAvailable,
  isNearQuotaLimit,
  daysUntilQuotaReset,
  
  // Week navigation
  currentWeek,
  goToCurrentWeek,
  goToPreviousWeek,
  
  // Validation
  validationErrors,
  hasValidationErrors,
  clearValidation
} = useWeeklySummaryComplete(client, authToken);
```

### useQuotaInfo

Manages quota information and status.

**Note:** In the current MVP, this hook is intended for internal application logic to check if the user has reached their summary generation limit. The quota information (e.g., remaining count) should **not** be displayed to the user.

```typescript
const {
  quota,           // Current quota info
  isAvailable,     // Can generate summaries
  isNearLimit,     // Close to limit (≤1 remaining)
  daysUntilReset,  // Days until quota resets
  updateQuota      // Manually refresh quota
} = useQuotaInfo(client);
```

### useWeekRange

Manages week selection and navigation.

```typescript
const {
  currentWeek,        // Current week range
  goToCurrentWeek,    // Navigate to current week
  goToPreviousWeek,   // Navigate to previous week
  goToWeek,           // Navigate to specific week
  isCurrentWeek       // Check if viewing current week
} = useWeekRange();
```

## 🛠️ Utilities

### Validation

```typescript
import { 
  validateWeeklySummaryRequest,
  validateWeekRange,
  preprocessRequest,
  getCurrentWeekRange 
} from '@/lib/api';

// Validate request before sending
const validation = validateWeeklySummaryRequest(request);
if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
}

// Get current week for form initialization
const thisWeek = getCurrentWeekRange();
console.log(thisWeek.startString); // '2025-02-10'
console.log(thisWeek.endString);   // '2025-02-16'

// Pre-process request (sanitize and validate)
const { request: cleanRequest, validation } = preprocessRequest(rawRequest);
```

### Retry Logic

```typescript
import { 
  RetryManager,
  createNetworkRetryManager,
  withRetry 
} from '@/lib/api';

// Create custom retry manager
const retryManager = new RetryManager({
  attempts: 5,
  delay: 2000,
  backoffMultiplier: 2,
  maxDelay: 30000
});

// Use with any async function
const result = await retryManager.execute(async () => {
  return await someApiCall();
});

// Quick retry for simple cases
const result = await withRetry(
  () => someApiCall(),
  { attempts: 3, delay: 1000 }
);
```

### Date Utilities

```typescript
import { 
  getCurrentWeekRange,
  getPreviousWeekRange,
  getMondayOfWeek,
  isMonday,
  isSunday 
} from '@/lib/api';

// Get week ranges
const currentWeek = getCurrentWeekRange();
const lastWeek = getPreviousWeekRange();

// Date validation
const isValidWeekStart = isMonday('2025-02-10'); // true
const isValidWeekEnd = isSunday('2025-02-16');   // true

// Find Monday for any date
const monday = getMondayOfWeek(new Date('2025-02-13'));
```

## 💡 Examples

### Basic Component Integration

```typescript
import React, { useState } from 'react';
import { 
  EdgeFunctionClient, 
  useWeeklySummary,
  getCurrentWeekRange,
  type Entry 
} from '@/lib/api';

const client = new EdgeFunctionClient({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
});

export function WeeklySummaryGenerator({ authToken }: { authToken: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const currentWeek = getCurrentWeekRange();
  
  const {
    loading,
    error,
    data,
    quota,
    generateSummary,
    clearError
  } = useWeeklySummary({ 
    client, 
    authToken,
    onSuccess: (data) => {
      console.log('Summary generated successfully!');
      // Auto-save or show notification
    },
    onError: (error) => {
      if (error.reason === 'quota_exceeded') {
        console.log('Quota exceeded, show upgrade prompt');
      }
    }
  });

  const handleGenerate = async () => {
    if (entries.length === 0) {
      alert('Please add some entries first');
      return;
    }

    await generateSummary({
      week_start: currentWeek.startString,
      week_end: currentWeek.endString,
      entries: entries,
      language: 'en',
      client_meta: {
        app_version: '1.0.0',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  };

  return (
    <div className="weekly-summary-generator">
      <h2>Week of {currentWeek.startString} to {currentWeek.endString}</h2>
      
      {/* Quota display */}
      {quota && (
        <div className="quota-info">
          Remaining summaries: {quota.remaining}/{quota.limit}
          {quota.remaining === 0 && (
            <p>Quota resets in {Math.ceil((quota.cycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</p>
          )}
        </div>
      )}

      {/* Entry input */}
      <div className="entries">
        {entries.map((entry, index) => (
          <div key={index} className="entry">
            <input
              type="datetime-local"
              value={entry.timestamp.slice(0, 16)}
              onChange={(e) => {
                const newEntries = [...entries];
                newEntries[index].timestamp = e.target.value + ':00.000Z';
                setEntries(newEntries);
              }}
            />
            <textarea
              value={entry.text}
              onChange={(e) => {
                const newEntries = [...entries];
                newEntries[index].text = e.target.value;
                setEntries(newEntries);
              }}
              placeholder="What did you work on?"
            />
          </div>
        ))}
        <button
          onClick={() => setEntries([...entries, { 
            timestamp: new Date().toISOString(), 
            text: '' 
          }])}
        >
          Add Entry
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="error">
          <p>Error: {error.message}</p>
          {error.retryable && (
            <button onClick={() => { clearError(); handleGenerate(); }}>
              Retry
            </button>
          )}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {/* Generate button */}
      <button 
        onClick={handleGenerate} 
        disabled={loading || entries.length === 0 || (quota && quota.remaining === 0)}
        className="generate-btn"
      >
        {loading ? 'Generating...' : 'Generate Weekly Summary'}
      </button>

      {/* Results */}
      {data && (
        <div className="summary-result">
          <h3>Weekly Summary</h3>
          <div className="summary-content">
            {data.summary.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Advanced Error Handling

```typescript
import { EdgeFunctionError } from '@/lib/api';

function handleSummaryError(error: EdgeFunctionError) {
  switch (error.reason) {
    case 'auth_error':
      // Redirect to login or refresh token
      console.log('Authentication failed, redirecting to login');
      break;
      
    case 'validation_error':
      // Show form validation errors
      console.log('Validation failed:', error.message);
      break;
      
    case 'quota_exceeded':
      // Show upgrade prompt or quota info
      console.log('Quota exceeded:', error.response?.cycle_end);
      break;
      
    case 'provider_error':
      // Temporary AI service issue, suggest retry
      if (error.retryable) {
        console.log('AI service temporarily unavailable, will retry');
      }
      break;
      
    case 'other_error':
      // Generic error handling
      console.log('Unexpected error:', error.message);
      break;
  }
}
```

### Custom Client Configuration

```typescript
// Development client with more aggressive retries
const devClient = new EdgeFunctionClient({
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey: 'dev-anon-key',
  timeout: 60000,  // Longer timeout for debugging
  retryAttempts: 5,
  retryDelay: 2000
});

// Production client with conservative settings
const prodClient = new EdgeFunctionClient({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});

// Client with custom retry logic for specific errors
const customRetryClient = prodClient.withRetry({
  attempts: 5,
  delay: 500
});
```

## 🔒 Security Considerations

### Authentication Tokens

- Always use fresh JWT tokens from Supabase Auth
- Never store tokens in localStorage - use secure token management
- Implement token refresh logic for long-running sessions

```typescript
// Good: Get fresh token from Supabase
const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  await client.generateWeeklySummary(request, session.access_token);
}

// Bad: Using stale or stored tokens
const storedToken = localStorage.getItem('token'); // Don't do this
```

### Input Validation

- Always validate user input before sending requests
- Use the built-in validation utilities
- Sanitize text entries to prevent issues

```typescript
import { preprocessRequest } from '@/lib/api';

// Pre-process request to sanitize and validate
const { request: cleanRequest, validation } = preprocessRequest(userInput);
if (!validation.valid) {
  // Handle validation errors
  console.log('Invalid input:', validation.errors);
  return;
}
```

### Error Information

- Error messages are safe to display to users
- Sensitive server details are not exposed in error responses
- Use structured error handling to avoid information leakage

## 📊 Testing

### Unit Testing

```typescript
import { EdgeFunctionClient } from '@/lib/api';

// Create mock client for testing
const mockClient = EdgeFunctionClient.createMock({
  timeout: 5000,
  retryAttempts: 1
});

// Test validation
describe('API Validation', () => {
  test('validates week range correctly', () => {
    const result = mockClient.validateRequest({
      week_start: '2025-02-10', // Monday
      week_end: '2025-02-16',   // Sunday
      entries: [{ timestamp: '2025-02-10T09:00:00.000Z', text: 'Test' }]
    });
    
    expect(result.valid).toBe(true);
  });
});
```

### Integration Testing

```typescript
// Test with real Supabase instance
const testClient = new EdgeFunctionClient({
  supabaseUrl: 'https://test-project.supabase.co',
  supabaseAnonKey: 'test-anon-key'
});

describe('Edge Function Integration', () => {
  test('generates summary successfully', async () => {
    const response = await testClient.generateWeeklySummary(
      validTestRequest,
      testAuthToken
    );
    
    expect(response.ok).toBe(true);
    expect(response.summary).toBeDefined();
    expect(response.remaining).toBeGreaterThanOrEqual(0);
  });
});
```

## 🚨 Troubleshooting

### Common Issues

**"EdgeFunctionClient not provided"**
- Ensure you're passing a client instance to hooks
- Check that client is properly initialized

**"Authentication token not provided"**
- Verify auth token is available and valid
- Implement proper token refresh logic

**"Validation failed: Week range must be exactly 7 days"**
- Ensure week_start is Monday and week_end is Sunday
- Use `getCurrentWeekRange()` for proper date calculation

**Network timeouts**
- Check internet connection
- Consider increasing timeout for slow connections
- Verify Supabase URL is correct

### Debug Mode

Enable detailed logging:

```typescript
const client = new EdgeFunctionClient({
  supabaseUrl: 'your-url',
  supabaseAnonKey: 'your-key',
  timeout: 60000 // Longer timeout for debugging
});

// Monitor network requests in browser dev tools
// Check Supabase dashboard for edge function logs
```

## 📚 Related Documentation

- [Edge Function Implementation](../../../supabase/functions/README.md)
- [MindReel API Specification](../../../.ai/edge-function-plan.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Hooks Documentation](https://react.dev/reference/react)