# MindReel Edge Functions Documentation

This directory contains Supabase Edge Functions for the MindReel MVP, implementing AI-powered weekly summary generation with quota management.

## 📁 Directory Structure

```
supabase/functions/
├── README.md                           # This documentation
├── _shared/                            # Shared utilities
│   ├── types.ts                       # TypeScript type definitions
│   ├── env.ts                         # Environment variable utilities
│   ├── normalization.ts               # Entry processing and prompt building
│   ├── openrouter.ts                  # OpenRouter API client
│   └── test-data.ts                   # Test data and mock objects
└── generate_weekly_summary/           # Weekly summary generation function
    └── index.ts                       # Main edge function implementation
```

## 🚀 Functions Overview

### `generate_weekly_summary`

Generates AI-powered summaries of user's weekly activities with intelligent quota management.

**Endpoint:** `POST /functions/v1/generate_weekly_summary`

**Features:**
- ✅ JWT-based user authentication
- ✅ Comprehensive request validation (dates, entries, formats)
- ✅ Rolling 28-day quota system (5 summaries per cycle)
- ✅ Entry normalization and deduplication
- ✅ Intelligent prompt building with content truncation
- ✅ Multi-language support (Polish/English with auto-detection)
- ✅ OpenRouter AI integration with error handling
- ✅ Race-condition-safe quota tracking
- ✅ Structured error responses with proper HTTP status codes

## 📋 API Contract

### Request Format

```json
{
  "week_start": "2025-02-10",            // Monday (YYYY-MM-DD)
  "week_end": "2025-02-16",              // Sunday (YYYY-MM-DD)
  "entries": [
    {
      "timestamp": "2025-02-10T09:12:00.000Z",
      "text": "Refactored authentication module"
    },
    {
      "timestamp": "2025-02-10T11:40:00.000Z", 
      "text": "Fixed Electron auto-update issue"
    }
  ],
  "language": "pl",                      // Optional: 'pl' | 'en'
  "client_meta": {                       // Optional metadata
    "app_version": "0.2.0",
    "timezone": "Europe/Warsaw",
    "locale": "pl-PL"
  }
}
```

### Success Response

```json
{
  "ok": true,
  "summary": "- Refaktoryzacja modułu uwierzytelniania...\n- Naprawiono mechanizm autoaktualizacji...",
  "remaining": 3,
  "cycle_end": "2025-03-05T12:34:56.000Z"
}
```

### Error Responses

```json
// Authentication Error
{
  "ok": false,
  "reason": "auth_error",
  "message": "Invalid or expired token"
}

// Validation Error
{
  "ok": false,
  "reason": "validation_error",
  "message": "Week range must be exactly 7 days (Mon–Sun)"
}

// Quota Exceeded
{
  "ok": false,
  "reason": "quota_exceeded",
  "remaining": 0,
  "cycle_end": "2025-03-05T12:34:56.000Z"
}

// Provider Error
{
  "ok": false,
  "reason": "provider_error",
  "retryable": true,
  "message": "AI service temporarily unavailable"
}

// Internal Error
{
  "ok": false,
  "reason": "other_error",
  "message": "Unexpected internal failure; retry later"
}
```

## ⚙️ Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI model access | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | AI model identifier | `openai/gpt-4o-mini` |
| `MAX_PROMPT_CHARS` | Maximum characters in AI prompt | `10000` |
| `ENTRY_TRUNCATION_LIMIT` | Max characters per entry | `500` |

### Auto-Provided Variables

These are automatically provided by Supabase:

- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `SUPABASE_ANON_KEY` - Anonymous key for client access
- `SUPABASE_DB_URL` - Direct database connection string

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging verbosity | `info` |

## 🔧 Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp supabase/.env.example supabase/.env.local
```

Set your OpenRouter API key in `.env.local`:

```bash
# Get your API key from https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### 2. Deploy Database Schema

Apply the quota management migration:

```bash
npx supabase db push
```

### 3. Deploy Edge Functions

Deploy to your Supabase project:

```bash
npx supabase functions deploy generate_weekly_summary
```

### 4. Set Environment Variables

Configure the required environment variables in your Supabase project:

```bash
npx supabase secrets set --env-file supabase/.env.local
```

## 🧪 Testing

### Local Development

Start the local Supabase environment:

```bash
npx supabase start
npx supabase functions serve
```

### Test with cURL

```bash
# Test the function
curl -X POST 'http://localhost:54321/functions/v1/generate_weekly_summary' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "week_start": "2025-02-10",
    "week_end": "2025-02-16",
    "entries": [
      {
        "timestamp": "2025-02-10T09:12:00.000Z",
        "text": "Completed important work task"
      }
    ],
    "language": "en"
  }'
```

### Test Data

Use the provided test data in `_shared/test-data.ts`:

```typescript
import { validRequestEN, validRequestPL, mockQuotaStates } from '../_shared/test-data.ts';
```

## 🏗️ Architecture Details

### Quota Management System

The quota system implements a rolling 28-day cycle with the following features:

1. **Lazy Initialization**: Quota records are created on first use
2. **Automatic Reset**: Cycles reset automatically after 28 days
3. **Concurrency Safety**: Race-condition-safe quota increments
4. **Performance**: Optimized database queries with proper indexing

### Entry Processing Pipeline

1. **Validation**: Comprehensive input validation (dates, formats, ranges)
2. **Normalization**: Chronological sorting and deduplication
3. **Truncation**: Per-entry length limits with clear indicators
4. **Optimization**: Intelligent content selection for prompt limits
5. **Language Detection**: Automatic Polish/English detection via diacritic analysis

### AI Integration

- **Provider**: OpenRouter API for model flexibility
- **Timeout**: 25-second timeout with proper error handling
- **Rate Limiting**: Automatic retry logic for transient failures
- **Format Enforcement**: Ensures bullet-point summary format
- **Usage Tracking**: Token usage logging for monitoring

## 🔒 Security Considerations

### Authentication
- JWT token validation for all requests
- Service role key for secure database operations
- Row-level security (RLS) policies for data isolation

### Data Protection
- Input sanitization and validation
- SQL injection prevention via parameterized queries
- Rate limiting through quota system
- Content length restrictions

### API Security
- Structured error responses (no sensitive data leakage)
- Timeout protection against DoS attacks
- Environment variable validation
- HTTPS-only communication

## 📊 Monitoring & Observability

### Logging

Structured logging with different levels:

```typescript
console.log(`Request from user: ${user.id}`);
console.log(`Validation passed for ${payload.entries.length} entries`);
console.log(`Quota check passed. Remaining: ${quotaInfo.remaining}`);
console.error('OpenRouter API failed:', llmResponse.error);
```

### Key Metrics to Monitor

- **Request Volume**: Requests per user/day
- **Quota Usage**: Distribution of quota consumption
- **AI Response Times**: OpenRouter API latency
- **Error Rates**: By error type and frequency
- **Token Usage**: AI model costs and usage patterns

### Error Tracking

All errors include:
- Error type classification
- User ID (when available)
- Request context
- Retry flags for transient failures

## 🚀 Deployment Checklist

### Before Deployment

- [ ] Set all required environment variables
- [ ] Deploy database migrations
- [ ] Test with sample data locally
- [ ] Verify OpenRouter API key and model access
- [ ] Review quota limits and cycle duration

### After Deployment

- [ ] Test production endpoints
- [ ] Monitor error logs for issues
- [ ] Verify quota system functionality
- [ ] Check AI response quality
- [ ] Set up monitoring alerts

### Rollback Plan

- [ ] Keep previous function version available
- [ ] Database migrations are additive (no breaking changes)
- [ ] Environment variables are backward compatible
- [ ] Client integration includes error handling

## 🔮 Future Enhancements

### Phase 2 Candidates (Not Currently Implemented)

1. **Enhanced Language Support**: Additional languages beyond Polish/English
2. **Custom Prompt Templates**: User-configurable summary styles
3. **Summary History**: Storage and retrieval of past summaries
4. **Advanced Analytics**: Usage patterns and productivity insights
5. **Batch Processing**: Multiple week processing in single request
6. **Webhook Integration**: Real-time notifications for summary completion

### Scalability Considerations

- **Caching**: Redis cache for frequent quota checks
- **Queue System**: Async processing for large entry sets
- **Model Selection**: Dynamic AI model selection based on content
- **Multi-Region**: Geo-distributed edge function deployment

## 📚 References

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Deno Runtime Documentation](https://deno.land/manual)
- [MindReel MVP Specification](../.ai/edge-function-plan.md)

## 🆘 Troubleshooting

### Common Issues

**"Missing environment variables"**
- Ensure all required variables are set in Supabase project settings
- Check variable names match exactly (case-sensitive)

**"Invalid or expired token"**
- Verify JWT token is valid and not expired
- Check Authorization header format: `Bearer <token>`

**"OpenRouter API failed"**
- Verify API key is valid and has sufficient credits
- Check model availability and spelling
- Monitor for rate limiting

**"Quota exceeded"**
- Check user's current quota status
- Verify cycle start date and 28-day calculation
- Consider cycle reset if appropriate

### Debug Mode

Enable debug logging:

```bash
npx supabase secrets set LOG_LEVEL=debug
```

This provides detailed logs for troubleshooting issues.