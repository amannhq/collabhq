/**
 * Optimized SWR Configuration for Better Performance
 * Reduces unnecessary re-fetches and improves perceived performance
 */

import { SWRConfiguration } from 'swr';

// Default fetcher with error handling and timeout
export const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      credentials: 'include', // CRITICAL: Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const error = new Error('An error occurred while fetching the data.');
      try {
        // @ts-ignore
        error.info = await res.json();
      } catch {
        // @ts-ignore
        error.info = { error: res.statusText || 'Unknown error' };
      }
      // @ts-ignore
      error.status = res.status;
      
      // If unauthorized, log for debugging
      if (res.status === 401) {
        console.warn('[SWR Fetcher] Unauthorized - cookies may not be set:', url);
      }
      
      throw error;
    }

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Base SWR configuration
 * Used by SWRProvider
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  
  // Reduce unnecessary re-fetches
  revalidateOnFocus: false, // Don't refetch on window focus (too aggressive)
  revalidateOnReconnect: true, // Refetch when internet reconnects
  revalidateIfStale: true, // Refetch if data is stale
  
  // Deduplication and caching
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  
  // Keep previous data while loading new data
  keepPreviousData: true,
  
  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 2000, // 2 seconds between retries
  
  // Performance optimizations
  compare: (a, b) => {
    // Deep comparison to avoid unnecessary re-renders
    return JSON.stringify(a) === JSON.stringify(b);
  },
  
  // Loading timeout
  loadingTimeout: 3000, // Show loading state after 3s
  
  // Suspense support
  suspense: false, // Disabled by default, enable per-hook if needed
};

/**
 * Configuration for frequently updated data (e.g., notifications)
 */
export const realtimeConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // Auto-refresh every 30 seconds
  dedupingInterval: 10000, // Less aggressive deduping
  revalidateOnFocus: true, // Refetch on focus for realtime data
};

/**
 * Configuration for infrequently updated data (e.g., user settings)
 */
export const staticConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 60000, // 1 minute deduping
  revalidateOnMount: false, // Don't refetch on mount if cached
  refreshInterval: 300000, // Auto-refresh every 5 minutes
};

/**
 * Configuration for dashboard stats (balance between fresh and fast)
 */
export const dashboardConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 30000, // 30 seconds
  refreshInterval: 180000, // Auto-refresh every 3 minutes
  keepPreviousData: true, // Always keep previous data
  revalidateIfStale: true,
};

/**
 * Configuration for infinite loading/pagination
 * Note: For useSWRInfinite, use these additional options:
 * - revalidateFirstPage: false
 * - persistSize: true
 * - parallel: false
 */
export const infiniteConfig: SWRConfiguration = {
  ...swrConfig,
  // These properties are only valid for useSWRInfinite hook, not SWRConfiguration
  // Use them directly when calling useSWRInfinite:
  // useSWRInfinite(getKey, fetcher, { ...infiniteConfig, revalidateFirstPage: false })
};

/**
 * Configuration for immutable data (won't change after creation)
 */
export const immutableConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: Infinity, // Never refetch
};

/**
 * Helper to create custom SWR config with overrides
 */
export function createSWRConfig(
  overrides: Partial<SWRConfiguration> = {}
): SWRConfiguration {
  return {
    ...swrConfig,
    ...overrides,
  };
}

export default swrConfig;

