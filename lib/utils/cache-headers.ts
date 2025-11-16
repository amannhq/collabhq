/**
 * Cache-Control Header Utilities
 * 
 * Provides standardized Cache-Control headers for API responses
 * to optimize client-side and CDN caching
 */

export const CacheHeaders = {
  /**
   * No caching - always fetch fresh data
   * Use for: Sensitive data, user-specific content
   */
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  /**
   * Short cache (30 seconds)
   * Use for: Frequently changing data (posts, notifications)
   */
  short: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  },

  /**
   * Medium cache (5 minutes)
   * Use for: Semi-static data (creators, projects)
   */
  medium: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  },

  /**
   * Long cache (1 hour)
   * Use for: Static data (stats, analytics)
   */
  long: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
  },

  /**
   * Very long cache (1 day)
   * Use for: Rarely changing data (organization settings)
   */
  veryLong: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
  },
} as const;

/**
 * Helper to add cache headers to NextResponse
 */
export function withCacheHeaders(
  response: Response,
  cacheType: keyof typeof CacheHeaders = 'medium'
): Response {
  const headers = new Headers(response.headers);
  const cacheHeaders = CacheHeaders[cacheType];
  
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
