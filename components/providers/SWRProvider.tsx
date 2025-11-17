'use client';

import { SWRConfig, Cache } from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { fetcher } from '@/lib/swr/fetcher';

const CACHE_STORAGE_KEY = 'app-cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class PersistentCache extends Map<string, any> {
  private metadata = new Map<string, number>();

  constructor(entries: Array<[string, { value: any; timestamp: number }]> = []) {
    super();
    const now = Date.now();
    entries.forEach(([key, entry]) => {
      if (!entry || typeof entry.timestamp !== 'number') {
        return;
      }

      if (now - entry.timestamp < CACHE_TTL_MS) {
        this.metadata.set(key, entry.timestamp);
        super.set(key, entry.value);
      }
    });
  }

  override get(key: string) {
    const timestamp = this.metadata.get(key);
    if (timestamp && Date.now() - timestamp > CACHE_TTL_MS) {
      this.metadata.delete(key);
      super.delete(key);
      return undefined;
    }
    return super.get(key);
  }

  override set(key: string, value: any) {
    this.metadata.set(key, Date.now());
    return super.set(key, value);
  }

  override delete(key: string) {
    this.metadata.delete(key);
    return super.delete(key);
  }

  override clear() {
    this.metadata.clear();
    return super.clear();
  }

  serialize() {
    const now = Date.now();
    const entries: Array<[string, { value: any; timestamp: number }]> = [];

    for (const [key, value] of super.entries()) {
      const timestamp = this.metadata.get(key);
      if (!timestamp || now - timestamp > CACHE_TTL_MS) {
        this.metadata.delete(key);
        super.delete(key);
        continue;
      }

      entries.push([key, { value, timestamp }]);
    }

    return entries;
  }
}

function restoreCacheEntries() {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Array<[string, { value: any; timestamp: number }]>;
  } catch {
    // Corrupted cache, clear it
    localStorage.removeItem(CACHE_STORAGE_KEY);
    return [];
  }
}

const persistentCaches = new Set<PersistentCache>();
let sharedCache: PersistentCache | null = null;
let persistenceHandler: (() => void) | null = null;

function localStorageProvider() {
  if (typeof window === 'undefined') {
    return new Map() as Cache;
  }

  if (!sharedCache) {
    sharedCache = new PersistentCache(restoreCacheEntries());
    persistentCaches.add(sharedCache);
  }

  const persistAllCaches = () => {
    try {
      const merged = new Map<string, { value: any; timestamp: number }>();

      for (const persistentCache of persistentCaches) {
        for (const [key, entry] of persistentCache.serialize()) {
          merged.set(key, entry);
        }
      }

      const serialized = JSON.stringify(Array.from(merged.entries()));
      localStorage.setItem(CACHE_STORAGE_KEY, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Storage full, fallback to in-memory cache for this session
        localStorage.removeItem(CACHE_STORAGE_KEY);
      }
    }
  };

  if (!persistenceHandler) {
    persistenceHandler = persistAllCaches;
    window.addEventListener('beforeunload', persistenceHandler);
    window.addEventListener('pagehide', persistenceHandler);
  }

  return sharedCache as Cache;
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const swrValue = useMemo(
    () => ({
      fetcher,
      provider: isClient ? localStorageProvider : undefined,
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      keepPreviousData: true,
    }),
    [isClient]
  );

  return (
    <SWRConfig
      value={swrValue}
    >
      {children}
    </SWRConfig>
  );
}
