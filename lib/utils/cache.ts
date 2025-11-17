/**
 * In-memory cache utility for serverless environments
 * Provides Redis-like functionality without external dependencies
 * Perfect for Vercel deployments
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    
    // Clean up expired entries every 5 minutes
    if (typeof window === 'undefined') {
      this.startCleanup();
    }
  }

  /**
   * Set a value in cache with TTL (time-to-live) in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await fetchFn();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const keys = Array.from(this.cache.keys());
    const entries = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      keys,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(e => e.expiresAt))
        : null,
      newestEntry: entries.length > 0
        ? Math.max(...entries.map(e => e.expiresAt))
        : null,
    };
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Don't prevent Node from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global cache instance (reused across function invocations in serverless)
declare global {
  var __memoryCache: MemoryCache | undefined;
}

export const cache = global.__memoryCache || new MemoryCache();

if (typeof window === 'undefined') {
  global.__memoryCache = cache;
}

/**
 * Cache key builders for consistent key naming
 */
export const CacheKeys = {
  orgStats: (orgId: string) => `org:${orgId}:stats`,
  orgAccess: (orgSlug: string, userId: string) => `org:access:${orgSlug}:${userId}`,
  userSession: (userId: string) => `user:session:${userId}`,
  projectStats: (projectId: string) => `project:${projectId}:stats`,
  creatorPosts: (creatorId: string, page: number = 1) => `creator:${creatorId}:posts:${page}`,
  pendingPosts: (orgId: string) => `org:${orgId}:pending`,
} as const;

/**
 * Helper function to invalidate cache by pattern
 */
export function invalidateCache(pattern: string): number {
  return cache.deletePattern(pattern);
}

/**
 * Invalidate all organization-related cache
 */
export function invalidateOrgCache(orgId: string): void {
  cache.deletePattern(`org:${orgId}:*`);
}

/**
 * Invalidate all user-related cache
 */
export function invalidateUserCache(userId: string): void {
  cache.deletePattern(`*:${userId}:*`);
}

export default cache;

