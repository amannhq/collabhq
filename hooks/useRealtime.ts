'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeMessage, RealtimeResource } from '@/types/realtime';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'error';

interface UseRealtimeOptions {
  organizationId?: string;
  resources?: RealtimeResource[];
  enabled?: boolean;
  onEvent?: (event: RealtimeMessage) => void;
}

interface UseRealtimeReturn {
  status: ConnectionStatus;
  lastEvent?: RealtimeMessage;
  lastHeartbeat?: string;
  error?: string;
  reconnect: () => void;
  disconnect: () => void;
}

const DEFAULT_RESOURCES: RealtimeResource[] = ['posts', 'metrics', 'notifications'];

export function useRealtime({
  organizationId,
  resources,
  enabled = true,
  onEvent,
}: UseRealtimeOptions = {}): UseRealtimeReturn {
  const [status, setStatus] = useState<ConnectionStatus>(
    enabled ? 'connecting' : 'idle'
  );
  const [lastEvent, setLastEvent] = useState<RealtimeMessage | undefined>(undefined);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const eventSourceRef = useRef<EventSource | null>(null);
  const listenersCleanupRef = useRef<Array<() => void>>([]);
  const eventCallbackRef = useRef<typeof onEvent>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);
  const connectFnRef = useRef<(() => void) | null>(null);
  const disconnectFnRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    eventCallbackRef.current = onEvent;
  }, [onEvent]);

  const resourceKey = useMemo(() => {
    if (!resources || resources.length === 0) {
      return DEFAULT_RESOURCES.join(',');
    }

    const uniqueResources = Array.from(new Set(resources));
    uniqueResources.sort();
    return uniqueResources.join(',');
  }, [resources]);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();

    if (organizationId) {
      params.set('organizationId', organizationId);
    }

    if (resourceKey) {
      params.set('resources', resourceKey);
    }

    // Prevent caching & allow multiple tabs to establish independent streams
    params.set('ts', Date.now().toString());

    return `/api/realtime/sse?${params.toString()}`;
  }, [organizationId, resourceKey]);

  const clearListeners = useCallback(() => {
    listenersCleanupRef.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch {
        // no-op
      }
    });
    listenersCleanupRef.current = [];
  }, []);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    clearListeners();
    reconnectAttemptsRef.current = 0;
    setStatus('closed');
  }, [clearListeners]);

  const scheduleReconnect = useCallback((attemptNumber: number) => {
    const MAX_RECONNECT_ATTEMPTS = 10;
    const BASE_DELAY = 1000; // 1 second
    const MAX_DELAY = 30000; // 30 seconds

    if (attemptNumber > MAX_RECONNECT_ATTEMPTS) {
      setStatus('error');
      setError('Unable to establish connection after multiple attempts.');
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      BASE_DELAY * Math.pow(2, attemptNumber - 1),
      MAX_DELAY
    );

    setStatus('reconnecting');
    setError(
      `Connection lost. Reconnecting in ${Math.round(delay / 1000)}s (attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS})…`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      // Call connect function if available, mounted, and not manually disconnected
      if (isMountedRef.current && !isManualDisconnectRef.current && connectFnRef.current) {
        console.log('[useRealtime] Executing scheduled reconnect');
        connectFnRef.current();
      } else {
        console.log('[useRealtime] Skipping scheduled reconnect - unmounted or disconnected');
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || !enabled || !isMountedRef.current) {
      console.log('[useRealtime] Skipping connect - window:', typeof window !== 'undefined', 'enabled:', enabled, 'mounted:', isMountedRef.current);
      return;
    }

    // Prevent duplicate connections
    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
      console.log('[useRealtime] Already connected, skipping');
      return;
    }

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    clearListeners();

    isManualDisconnectRef.current = false;
    setStatus('connecting');
    setError(undefined);

    const url = buildUrl();
    console.log('[useRealtime] Attempting to connect to:', url);
    const source = new EventSource(url);
    eventSourceRef.current = source;

    const addListener = (
      eventName: string,
      handler: (event: MessageEvent<string>) => void
    ) => {
      const wrappedHandler = handler as EventListener;
      source.addEventListener(eventName, wrappedHandler);

      listenersCleanupRef.current.push(() => {
        source.removeEventListener(eventName, wrappedHandler);
      });
    };

    const parseTimestamp = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as { timestamp?: string };
        return payload.timestamp ?? new Date().toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    addListener('connected', (event) => {
      console.log('[useRealtime] Received connected event:', event.data);
      setStatus('open');
      setError(undefined);
      setLastHeartbeat(parseTimestamp(event));
    });

    addListener('heartbeat', (event) => {
      console.log('[useRealtime] Received heartbeat');
      setLastHeartbeat(parseTimestamp(event));
    });

    const resourceList =
      resources && resources.length > 0
        ? Array.from(new Set(resources))
        : DEFAULT_RESOURCES;

    resourceList.forEach((resource) => {
      addListener(resource, (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimeMessage;
          setLastEvent(payload);
          eventCallbackRef.current?.(payload);
        } catch (parseError) {
          console.error('Failed to parse realtime event payload', parseError);
        }
      });
    });

    source.onopen = () => {
      console.log('[useRealtime] EventSource opened, readyState:', source.readyState);
      setStatus('open');
      setError(undefined);
      reconnectAttemptsRef.current = 0; // Reset on successful connection
    };

    source.onerror = (err) => {
      console.error('[useRealtime] EventSource error, readyState:', source.readyState, 'error:', err);
      
      // Close the EventSource to prevent automatic reconnection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      clearListeners();

      // Don't reconnect if it was a manual disconnect
      if (isManualDisconnectRef.current) {
        console.log('[useRealtime] Manual disconnect, not reconnecting');
        setStatus('closed');
        return;
      }

      // Increment and schedule reconnect with exponential backoff
      reconnectAttemptsRef.current += 1;
      console.log('[useRealtime] Scheduling reconnect attempt:', reconnectAttemptsRef.current);
      scheduleReconnect(reconnectAttemptsRef.current);
    };
  }, [buildUrl, clearListeners, scheduleReconnect, enabled, resources]);

  // Store functions in refs for use in effects without triggering re-renders
  useEffect(() => {
    connectFnRef.current = connect;
    disconnectFnRef.current = disconnect;
  }, [connect, disconnect]);

  // Connect once on mount or when enabled changes
  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;

    if (!enabled) {
      // When disabled, call disconnect which properly sets status to 'closed'
      disconnectFnRef.current?.();
      return;
    }

    // Only connect if we don't already have an active connection
    if (!eventSourceRef.current) {
      console.log('[useRealtime] Initial connection on mount/enable');
      connectFnRef.current?.();
    }

    return () => {
      console.log('[useRealtime] Cleanup - disconnecting');
      isMountedRef.current = false;
      disconnectFnRef.current?.();
    };
  }, [enabled]); // Only re-run when enabled changes, not when connect/disconnect change

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  return {
    status,
    lastEvent,
    lastHeartbeat,
    error,
    reconnect,
    disconnect,
  };
}

