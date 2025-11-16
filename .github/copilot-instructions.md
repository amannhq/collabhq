# GitHub Copilot Instructions

## Project Overview: Creator Tracker SaaS

A multi-tenant SaaS platform for tracking creator performance using:
- **Next.js 16+** (App Router), **TypeScript** (strict), **MongoDB/Mongoose**
- **Better Auth**, **Shadcn UI**, **Zustand**, **GraphQL** (analytics only)
- **Zod** validation, **React Hook Form**

### Tech Stack Rules
- ✅ Use **Shadcn components only** - never create custom UI
- ✅ Use **MCP servers**: `shadcn`, `exa-search`, `better-auth-docs`
- ✅ REST for CRUD, GraphQL for analytics
- ✅ Always return `{ success: boolean, data?: T, error?: string }`

### Architecture
- **Multi-tenant**: Filter every query by `organizationId`
- **URLs**: `/[org]/...` (admin), `/creator/[id]` (creators)
- **Database**: Append-only metrics (time-series), use `lean()` for reads
- **Auth**: Better Auth with session checks on all protected routes

### Key Patterns
```typescript
// API Route Template
await connectDB();
const session = await getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Database Query
const posts = await Post.find({ organizationId }).populate('creatorId').lean();

// Form Validation
const schema = z.object({ ... });
const form = useForm({ resolver: zodResolver(schema) });
```

**Full details**: See project rules in workspace root.

---

## Logging Standards - CRITICAL

### 🚫 NEVER Use console.log

This project uses **Pino logger with worker thread transport**. All `console.log`, `console.error`, `console.warn`, and `console.debug` statements are **STRICTLY FORBIDDEN**.

### 🚫 NEVER Use Logger in Client Components

**Client components (`'use client'`) MUST NOT import or use the logger.** The logger uses Node.js worker threads which cannot be bundled for the browser. Only use the logger in:
- ✅ Server Components
- ✅ API Routes
- ✅ Server Actions
- ✅ Middleware
- ❌ Client Components (use toast notifications instead)

### Required Logging Pattern

**ALWAYS** use structured logging with Pino (SERVER-SIDE ONLY):

```typescript
// ✅ SERVER COMPONENT OR API ROUTE ONLY
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('module-name');

// ✅ CORRECT - Structured data first, message second
logger.info({ userId, email, action: 'login' }, 'User authenticated');
logger.error({ error, userId, endpoint: '/api/posts' }, 'Request failed');

// ❌ WRONG
console.log('User logged in');  // NEVER use console
logger.info(`User ${userId} logged in`);  // NO string interpolation
logger.info('User logged in');  // NO missing structured data
```

## Core Logging Requirements

1. **Module-Specific Loggers**: Create one logger per module
   ```typescript
   const logger = createLogger('auth-service');
   ```

2. **Structured Format**: `logger.level({ data }, 'message')`
   ```typescript
   logger.info({ userId, duration: 145 }, 'Request completed');
   ```

3. **Include Context**: Always add relevant metadata
   ```typescript
   logger.error({ error, userId, requestId, endpoint }, 'Operation failed');
   ```

4. **Appropriate Levels**:
   - `trace/debug` - Development only
   - `info` - Important business events
   - `warn` - Potential issues
   - `error` - Errors needing attention
   - `fatal` - Critical failures

5. **Never Log Sensitive Data**: No passwords, tokens, API keys, or credit cards

## Common Patterns

**Error Handling:**
```typescript
try {
  await operation();
} catch (error) {
  logger.error({ error, userId, context }, 'Operation failed');
  throw error;
}
```

**Performance Tracking:**
```typescript
const startTime = Date.now();
// ... operation ...
logger.info({ duration: Date.now() - startTime, success: true }, 'Completed');
```

**Request Tracing:**
```typescript
const requestLogger = logger.child({ requestId: randomUUID() });
requestLogger.info({ method, url }, 'Request received');
```

## Environment Configuration

```bash
LOG_LEVEL=debug  # trace|debug|info|warn|error|fatal
NODE_ENV=development
```

## Full Documentation

- **Complete guide**: `docs/logging/logging.mdx`
- **Code examples**: `docs/logging/logging-examples.ts`
- **8 real-world patterns**: Error handling, performance, tracing, database queries, batch operations, cron jobs, API routes, services

---

**Why This Matters**: Worker thread logging provides **zero-blocking**, high-performance logging. All I/O operations happen in a separate thread, ensuring your application's main event loop is never blocked by logging. This architecture allows you to log extensively without any performance penalty.

**Reference these files for complete patterns and best practices.**
