import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const logger = createLogger('api-error-handler');

// =====================================================
// CUSTOM ERROR CLASSES
// =====================================================

/**
 * Base API error class with status code and error code
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// =====================================================
// ERROR HANDLER HOF
// =====================================================

/**
 * Higher-order function that wraps API route handlers with:
 * - Automatic error handling
 * - Request/response logging
 * - Correlation ID tracking
 * - Performance monitoring
 * - Production-safe error messages
 */
export function withErrorHandler<T = unknown>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    const correlationId = randomUUID();
    const startTime = Date.now();

    try {
      // Add correlation ID to request for tracing
      (request as unknown as Request & { correlationId: string }).correlationId = correlationId;

      // Execute the actual handler
      const response = await handler(request, context);

      // Log successful requests
      const duration = Date.now() - startTime;
      logger.info(
        {
          correlationId,
          method: request.method,
          url: request.url,
          status: response.status,
          duration,
        },
        'Request completed'
      );

      // Add correlation ID to response headers for tracing
      response.headers.set('X-Correlation-ID', correlationId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        logger.warn(
          {
            correlationId,
            method: request.method,
            url: request.url,
            duration,
            validationErrors: error.issues,
          },
          'Validation error'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            correlationId,
            details: error.issues.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          {
            status: 400,
            headers: { 'X-Correlation-ID': correlationId },
          }
        );
      }

      // Handle known API errors
      if (error instanceof ApiError) {
        logger.warn(
          {
            correlationId,
            method: request.method,
            url: request.url,
            status: error.statusCode,
            code: error.code,
            duration,
            error: error.message,
          },
          'API error occurred'
        );

        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            correlationId,
            ...(error.details && typeof error.details === 'object' && !Array.isArray(error.details) ? error.details as Record<string, unknown> : { details: error.details }),
          },
          {
            status: error.statusCode,
            headers: { 'X-Correlation-ID': correlationId },
          }
        );
      }

      // Handle Mongoose validation errors
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'ValidationError'
      ) {
        logger.warn(
          {
            correlationId,
            method: request.method,
            url: request.url,
            error,
            duration,
          },
          'Database validation error'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            code: 'DB_VALIDATION_ERROR',
            correlationId,
          },
          {
            status: 400,
            headers: { 'X-Correlation-ID': correlationId },
          }
        );
      }

      // Handle Mongoose CastError (invalid ObjectId)
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'CastError'
      ) {
        logger.warn(
          {
            correlationId,
            method: request.method,
            url: request.url,
            error,
            duration,
          },
          'Invalid ID format'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Invalid ID format',
            code: 'INVALID_ID',
            correlationId,
          },
          {
            status: 400,
            headers: { 'X-Correlation-ID': correlationId },
          }
        );
      }

      // Handle unexpected errors
      logger.error(
        {
          correlationId,
          method: request.method,
          url: request.url,
          error,
          duration,
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Unhandled error in API route'
      );

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          correlationId,
          ...(isDevelopment && {
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
        {
          status: 500,
          headers: { 'X-Correlation-ID': correlationId },
        }
      );
    }
  };
}

// =====================================================
// CONVENIENCE ERROR CONSTRUCTORS
// =====================================================

/**
 * 400 Bad Request - Client sent invalid data
 */
export const BadRequestError = (message: string, details?: unknown) =>
  new ApiError(400, message, 'BAD_REQUEST', details);

/**
 * 401 Unauthorized - User is not authenticated
 */
export const UnauthorizedError = (message = 'Unauthorized') =>
  new ApiError(401, message, 'UNAUTHORIZED');

/**
 * 403 Forbidden - User is authenticated but lacks permissions
 */
export const ForbiddenError = (message = 'Forbidden') =>
  new ApiError(403, message, 'FORBIDDEN');

/**
 * 404 Not Found - Resource does not exist
 */
export const NotFoundError = (resource: string) =>
  new ApiError(404, `${resource} not found`, 'NOT_FOUND');

/**
 * 409 Conflict - Resource already exists or conflict with current state
 */
export const ConflictError = (message: string) =>
  new ApiError(409, message, 'CONFLICT');

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export const TooManyRequestsError = (retryAfter?: number) =>
  new ApiError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED', { retryAfter });

/**
 * 422 Unprocessable Entity - Validation error but syntactically correct
 */
export const UnprocessableEntityError = (message: string, details?: unknown) =>
  new ApiError(422, message, 'UNPROCESSABLE_ENTITY', details);

/**
 * 503 Service Unavailable - Temporary service outage
 */
export const ServiceUnavailableError = (message = 'Service temporarily unavailable') =>
  new ApiError(503, message, 'SERVICE_UNAVAILABLE');

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extract correlation ID from request (set by withErrorHandler)
 */
export function getCorrelationId(request: NextRequest): string | undefined {
  return (request as Request & { correlationId?: string }).correlationId;
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
