'use client';

import type { ConnectionStatus } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  status: ConnectionStatus;
  label?: string;
  compact?: boolean;
  className?: string;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  open: 'Live',
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  idle: 'Offline',
  closed: 'Offline',
  error: 'Offline',
};

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  open: 'bg-emerald-500',
  connecting: 'bg-amber-500',
  reconnecting: 'bg-amber-500',
  idle: 'bg-zinc-400',
  closed: 'bg-zinc-400',
  error: 'bg-rose-500',
};

export function RealtimeIndicator({
  status,
  label,
  compact = false,
  className,
}: RealtimeIndicatorProps) {
  const resolvedLabel = label ?? STATUS_LABELS[status] ?? 'Offline';
  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.error;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm',
        compact && 'px-2 py-0.5 text-[11px]',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-2 w-2 rounded-full',
          colorClass,
          status !== 'open' && 'animate-pulse'
        )}
      />
      <span>{resolvedLabel}</span>
    </span>
  );
}

