'use client';

import { SWRConfig, Cache } from 'swr';
import { fetcher } from '@/lib/swr/fetcher';
import { useEffect, useState } from 'react';

// Custom cache provider with localStorage persistence
function localStorageProvider() {
  // Initialize with in-memory cache
  const map = new Map<string, any>(JSON.parse(localStorage.getItem('app-cache') || '[]'));

  // Save to localStorage on window unload
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem('app-cache', appCache);
  });

  return map as Cache;
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <SWRConfig
      value={{
        fetcher,
        // Cache Configuration
        provider: isClient ? localStorageProvider : undefined,
        dedupingInterval: 10000, // 10 seconds - prevent duplicate requests
        
        // Revalidation Strategy
        revalidateOnFocus: false, // Don't refetch on window focus
        revalidateOnReconnect: true, // Refetch when network reconnects
        revalidateIfStale: true, // Revalidate if data is stale
        
        // Error Handling
        shouldRetryOnError: false, // Don't retry failed requests
        errorRetryCount: 0,
        
        // Performance
        keepPreviousData: true, // Show stale data while revalidating
      }}
    >
      {children}
    </SWRConfig>
  );
}
