import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// =====================================================
// COMMON SCHEMAS
// =====================================================

/**
 * MongoDB ObjectId validation
 */
export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

/**
 * Pagination schema with sensible defaults
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Organization query schema (requires either slug or id)
 */
export const OrganizationQuerySchema = z.object({
  slug: z.string().min(1).max(100).optional(),
  id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
}).refine(data => data.slug || data.id, {
  message: 'Either slug or id must be provided'
});

/**
 * Search parameter sanitizer - escapes regex special characters to prevent ReDoS
 */
export const SearchParamsSanitizer = z.object({
  search: z.string()
    .max(200)
    .transform(val => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex special chars
    .optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
  type: z.string().max(50).optional(),
});

/**
 * Post URL validation - must be a valid Twitter/X status URL
 */
export const PostUrlSchema = z.string()
  .url('Must be a valid URL')
  .regex(
    /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d{10,20}/,
    'Must be a valid Twitter/X post URL (e.g., https://x.com/username/status/1234567890)'
  );

// =====================================================
// API-SPECIFIC SCHEMAS
// =====================================================

/**
 * Post creation schema
 */
export const PostCreateSchema = z.object({
  projectId: ObjectIdSchema,
  postUrl: PostUrlSchema,
  caption: z.string().max(5000).optional(),
  metrics: z.object({
    likes: z.number().int().nonnegative().default(0),
    retweets: z.number().int().nonnegative().default(0),
    replies: z.number().int().nonnegative().default(0),
    quotes: z.number().int().nonnegative().default(0),
    impressions: z.number().int().nonnegative().default(0),
  }).optional(),
});

/**
 * Post update schema
 */
export const PostUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  caption: z.string().max(5000).optional(),
  metrics: z.object({
    likes: z.number().int().nonnegative(),
    retweets: z.number().int().nonnegative(),
    replies: z.number().int().nonnegative(),
    quotes: z.number().int().nonnegative(),
    impressions: z.number().int().nonnegative(),
  }).optional(),
});

/**
 * Posts list query schema with sanitized search
 */
export const PostsQuerySchema = z.object({
  organizationId: ObjectIdSchema.optional(),
  projectId: ObjectIdSchema.optional(),
  creatorId: ObjectIdSchema.optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
  search: z.string()
    .max(200)
    .transform(val => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Activity query schema with comprehensive filtering
 */
export const ActivityQuerySchema = z.object({
  // Organization and user context
  orgId: ObjectIdSchema.optional(),
  organizationId: ObjectIdSchema.optional(),
  userId: ObjectIdSchema.optional(),
  projectId: ObjectIdSchema.optional(),

  // Action and entity filtering
  action: z.string().max(100).optional(),
  entityType: z.string().max(50).optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),

  // Status and outcome
  status: z.enum(['success', 'error', 'failed']).optional(),

  // Search and tags (sanitized for regex safety)
  search: z.string()
    .max(200)
    .transform(val => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .optional(),
  tags: z.string()
    .max(500)
    .transform(val => {
      // Split by comma, trim, and filter empty strings
      const tags = val.split(',').map(tag => tag.trim()).filter(Boolean);
      return tags.length > 0 ? tags : undefined;
    })
    .optional(),

  // Actor and role filtering
  actor: z.string().max(200).optional(),
  role: z.enum(['admin', 'creator']).optional(), // Only admin/creator for filtering

  // Date range
  startDate: z.string()
    .transform(val => {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    })
    .optional(),
  endDate: z.string()
    .transform(val => {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    })
    .optional(),

  // Pagination and sorting
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sort: z.enum(['asc', 'desc']).default('desc'),

  // Export options
  format: z.enum(['json', 'csv']).optional(),
  exportLimit: z.coerce.number().int().positive().max(10000).default(500),
});

/**
 * Project creation schema
 */
export const ProjectCreateSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(2000).optional(),
  organizationId: ObjectIdSchema,
  status: z.enum(['active', 'paused', 'completed']).default('active'),
  requirePostApproval: z.boolean().default(true),
  metricUpdateFrequency: z.number().int().positive().max(168).default(24), // Max 1 week in hours
  autoReminders: z.boolean().default(true),
});

/**
 * Project update schema
 */
export const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
  requirePostApproval: z.boolean().optional(),
  metricUpdateFrequency: z.number().int().positive().max(168).optional(),
  autoReminders: z.boolean().optional(),
});

/**
 * Projects query schema
 */
export const ProjectsQuerySchema = z.object({
  organizationId: ObjectIdSchema.optional(),
  orgId: ObjectIdSchema.optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
}).refine(data => data.organizationId || data.orgId, {
  message: 'Either organizationId or orgId must be provided'
});

/**
 * Creator invite schema
 */
export const CreatorInviteSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  name: z.string().min(1, 'Name is required').max(200),
  organizationId: ObjectIdSchema,
  projectId: ObjectIdSchema,
  twitterHandle: z.string()
    .min(1, 'Twitter handle is required')
    .max(16) // Twitter allows up to 15 chars, plus @ prefix
    .transform(val => val.startsWith('@') ? val.substring(1) : val) // Remove @ if present
    .refine(val => /^[a-zA-Z0-9_]+$/.test(val), {
      message: 'Twitter handle can only contain letters, numbers, and underscores'
    }),
  message: z.string().max(1000).optional(),
});

/**
 * Organization update schema
 */
export const OrganizationUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(2000).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// =====================================================
// VALIDATION MIDDLEWARE
// =====================================================

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (
    request: NextRequest,
    handler: (data: z.infer<T>, req: NextRequest) => Promise<NextResponse>
  ) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      return handler(validated, request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.issues.map((e: z.ZodIssue) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

/**
 * Validate search params against a Zod schema
 */
export function validateSearchParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'Invalid query parameters',
            details: error.issues.map((e: z.ZodIssue) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    throw error;
  }
}

/**
 * Sanitize string input for safe regex usage
 */
export function sanitizeRegexInput(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
