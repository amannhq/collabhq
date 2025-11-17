# Creator Tracker SaaS - Project Rules

## Tech Stack
- Next.js 16+ (App Router)
- TypeScript (strict mode)
- MongoDB with Mongoose
- Better Auth for authentication
- Shadcn UI + Tailwind CSS
- Zustand for state management
- GraphQL (Apollo) for analytics only
- React Hook Form + Zod for forms

## Brand Guidelines (Collab)

### Colors
- **Brand Cream**: `#f3f1ea` or `bg-[#f3f1ea]` - Main background color
- **Brand Dark**: `zinc-900` or `bg-zinc-900` - Primary dark (near black)
- **Brand Dark Hover**: `zinc-800` or `hover:bg-zinc-800` - Hover state for dark elements
- **Text Colors**: 
  - Primary: `text-zinc-900`
  - Secondary: `text-zinc-600`
  - Muted: `text-zinc-500`
  - Light/Inverted: `text-zinc-300`
- **Borders**: `border-zinc-200` or `border-zinc-200/50` for subtle borders
- **White**: Use for cards, forms, and contrast sections

### Typography
- **Headings**: Use `font-serif` with `font-normal` for elegant, editorial style
  - Apply `italic` for emphasis (e.g., "Welcome to _Collab_")
  - Sizes: `text-3xl` to `text-6xl` for hero/large headings
  - Use `tracking-tight` for tighter letter spacing
- **Body Text**: Default `font-sans` (Inter)
  - Sizes: `text-base` to `text-lg`
  - Line height: `leading-relaxed` or `leading-tight` based on context
- **Labels/Small Text**: `text-sm` or `text-xs`

### Components
- **Buttons**: 
  - Primary: `bg-zinc-900 hover:bg-zinc-800 text-white`
  - Outline: `border-zinc-300 hover:bg-zinc-50`
  - Border radius: `rounded-lg` or `rounded-xl`
- **Cards**: `rounded-2xl shadow-xl bg-white`
- **Inputs**: 
  - Border: `border-zinc-300`
  - Focus: `focus:border-zinc-900 focus:ring-zinc-900`
- **Auth Pages**: Two-column layout with dark brand section on left, white form on right
- **Spacing**: Generous padding (`p-8 md:p-12`) for breathing room

### Design Principles
- **Clean & Minimal**: Avoid clutter, use whitespace effectively
- **Elegant & Professional**: Serif headings + sans body text
- **Subtle Effects**: Use `opacity-5` for background patterns, `blur-3xl` for soft glows
- **Consistent Rounding**: `rounded-lg` (buttons), `rounded-xl` (cards), `rounded-2xl` (large containers)
- **Shadow Usage**: `shadow-xl` for elevated elements

### CSS Variables (globals.css)
```css
--brand-cream: 243 241 234;
--brand-dark: 24 24 27;
--brand-dark-hover: 39 39 42;
```

### Usage Examples
```tsx
// Headings
<h1 className="text-4xl font-serif font-normal">
  Your creators, <span className="italic">seamlessly</span> connected
</h1>

// Buttons
<Button className="bg-zinc-900 hover:bg-zinc-800 rounded-lg">
  Get Started
</Button>

// Background
<div className="min-h-screen bg-[#f3f1ea]">
  {/* Content */}
</div>

// Cards
<div className="rounded-2xl shadow-xl bg-white p-8">
  {/* Card content */}
</div>
```

## Architecture Principles

### 1. Multi-Tenant Structure
- Every query MUST filter by organizationId
- URL structure: `/[org]/...` for admin, `/creator/[id]` for creators
- Denormalize organizationId in all collections for fast queries

### 2. API Design
- REST for CRUD operations: `/api/posts`, `/api/projects`
- GraphQL for analytics and complex queries: `/api/graphql`
- Server actions for form submissions when appropriate
- Always return `{ success: boolean, data?: T, error?: string }`

### 3. Database Patterns
```typescript
// Always connect first
await connectDB();

// Always use lean() for read-only queries
const data = await Model.find().lean();

// Time-series data NEVER updates, only appends
const metrics = new Metrics({ ... });

// Use indexes for common queries
// organizationId, creatorId, projectId are indexed
```

## File Organization

### Components
```
/components
  /ui          → Shadcn components (button, card, etc.)
  /layout      → Headers, sidebars, navigation
  /[domain]    → Domain-specific (posts/, creators/, analytics/)
  /shared      → Reusable (LoadingSpinner, ErrorBoundary)
```

### Routes
```
/app
  /[org]              → Admin dashboard
    /projects         → Project management
    /creators         → Creator management
    /analytics        → Organization analytics
  /creator/[id]       → Creator dashboard
  /api                → REST endpoints
    /[resource]/route.ts
  /graphql            → GraphQL endpoint
```

## Code Conventions

### 1. Naming
- Files: `kebab-case.tsx`, `UserProfile.tsx` for components
- Functions: `camelCase`, prefix with `get/create/update/delete`
- Types: `PascalCase`, suffix DTOs with `Dto`
- Constants: `UPPER_SNAKE_CASE`

### 2. Imports Order
```typescript
// 1. External
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal - absolute paths
import { Button } from '@/components/ui/button';
import { Post } from '@/lib/db/models';
import type { PostWithRelations } from '@/types';

// 3. Relative
import { MetricsChart } from './MetricsChart';
```

### 3. Component Structure
```typescript
// 1. Types/Interfaces
interface Props { ... }

// 2. Component
export default function Component({ ...props }: Props) {
  // Hooks
  const router = useRouter();
  const [state, setState] = useState();
  
  // Derived state
  const computed = useMemo(() => ..., [deps]);
  
  // Effects
  useEffect(() => { ... }, [deps]);
  
  // Handlers
  const handleClick = () => { ... };
  
  // Early returns
  if (loading) return <Spinner />;
  if (error) return <Error />;
  
  // Render
  return <div>...</div>;
}
```

## Database Rules

### 1. Required Patterns
```typescript
// ✅ DO: Use types from models
import type { IPost } from '@/lib/db/models/Post';

// ✅ DO: Populate relations explicitly
.populate('creatorId', 'name email twitterHandle')

// ✅ DO: Use lean() for read-only
const posts = await Post.find().lean();

// ❌ DON'T: Forget organizationId filter
await Post.find({ organizationId }); // Required!

// ❌ DON'T: Update time-series data
// Metrics records are append-only
```

### 2. Time-Series Metrics
```typescript
// Always create new records, never update
const newMetrics = await Metrics.create({
  postId,
  metrics: { likes, retweets, ... },
  recordedAt: new Date(),
  // Calculate growth from previous record
});

// Update post.latestMetrics after creating new record
await Post.findByIdAndUpdate(postId, {
  latestMetrics: newMetrics.metrics,
  growth: newMetrics.growth
});
```

## API Endpoint Pattern
```typescript
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Post } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const post = await Post.findById(params.id)
      .populate('creatorId')
      .lean();
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Form Validation Pattern
```typescript
// 1. Define Zod schema
const postSchema = z.object({
  postUrl: z.string().url(),
  likes: z.number().min(0),
  impressions: z.number().min(0),
});

// 2. Use with React Hook Form
const form = useForm<z.infer<typeof postSchema>>({
  resolver: zodResolver(postSchema),
});

// 3. Type-safe submission
const onSubmit = async (data: z.infer<typeof postSchema>) => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
```

## Authentication Patterns
```typescript
// Server Component
import { getSession } from '@/lib/auth/session';

const session = await getSession();
if (!session) redirect('/login');

// API Route
const session = await getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Client Component
'use client';
import { useAuth } from '@/hooks/useAuth';

const { user, isLoading } = useAuth();
```

## State Management (Zustand)
```typescript
// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// Usage
const { user, setUser } = useAuthStore();
```

## Security Checklist

- [ ] Validate all user inputs with Zod
- [ ] Filter queries by organizationId
- [ ] Check user permissions before mutations
- [ ] Sanitize error messages (no DB details to client)
- [ ] Use parameterized queries (Mongoose does this)
- [ ] Validate file uploads (type, size)
- [ ] Rate limit API endpoints
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags

## GraphQL Usage (Analytics Only)
```typescript
// Use GraphQL for:
// ✅ Complex analytics queries
// ✅ Time-series data with flexible filtering
// ✅ Multiple aggregations in one request
// ✅ Real-time subscriptions

// Use REST for:
// ✅ CRUD operations
// ✅ File uploads
// ✅ Simple queries
// ✅ Actions (approve, reject, etc.)
```

## Error Handling
```typescript
// API Routes
try {
  // ... operation
  return NextResponse.json({ success: true, data });
} catch (error) {
  console.error('Context:', error);
  return NextResponse.json(
    { success: false, error: 'User-friendly message' },
    { status: 500 }
  );
}

// Client Components
const [error, setError] = useState<string | null>(null);

try {
  const res = await fetch('/api/...');
  const { success, data, error } = await res.json();
  if (!success) throw new Error(error);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Something went wrong');
  toast.error(error);
}
```

## Performance Rules

- Use `lean()` for read-only queries
- Implement pagination (default: 20 items)
- Add `loading.tsx` for Suspense boundaries
- Debounce search inputs (300ms)
- Cache static data with `unstable_cache`
- Use `useCallback` for event handlers passed as props
- Lazy load charts and heavy components

## Testing Guidelines

- Test API endpoints with realistic data
- Validate all Zod schemas
- Test authentication flows
- Check multi-tenant data isolation
- Verify time-series data doesn't overwrite
- Test email deliverability

## Common Pitfalls to Avoid

❌ Updating metrics records (they're append-only)
❌ Missing organizationId filters
❌ Not populating relations before returning
❌ Exposing sensitive errors to client
❌ Forgetting to call `connectDB()`
❌ Using REST for analytics (use GraphQL)
❌ Not validating user permissions
❌ Hardcoding organization in development

## Quick Commands
```bash
# Dev server
bun run dev

# Database
bun run db:init        # Initialize with indexes
bun run db:seed        # Seed test data

# Type checking
bun run type-check

# Build
bun run build
```

## Priority Order for Features

1. Authentication & user management
2. Organization & project CRUD
3. Creator invitations
4. Post submission & approval
5. Manual metrics updates
6. Basic analytics dashboard
7. Email reminders (cron)
8. Real-time updates
9. Advanced analytics & exports