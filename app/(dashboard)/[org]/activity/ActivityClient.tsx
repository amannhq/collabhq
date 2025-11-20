'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { ActivityFilters, ActivityFilterState } from '@/components/activity/ActivityFilters';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import type { ActivityLogListPayload } from '@/types/activity';
import { fetcher } from '@/lib/swr/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';

interface ActivityClientProps {
  organizationId: string;
  orgSlug: string;
}

type ActivityResponse = {
  success: boolean;
  data?: ActivityLogListPayload;
  error?: string;
};

const DEFAULT_LIMIT = 25;

const DEFAULT_FILTERS: ActivityFilterState = {
  search: '',
  actor: '',
  action: 'all',
  entityType: 'all',
  severity: 'all',
  status: 'all',
  role: 'all',
  tags: '',
  dateRange: undefined,
};

export function ActivityClient({ organizationId, orgSlug }: ActivityClientProps) {
  const [filters, setFilters] = useState<ActivityFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const queryKey = useMemo(() => {
    const params = new URLSearchParams({
      orgId: organizationId,
      page: String(page),
      limit: String(DEFAULT_LIMIT),
    });

    if (filters.search.trim()) {
      params.set('search', filters.search.trim());
    }
    if (filters.actor.trim()) {
      params.set('actor', filters.actor.trim());
    }
    if (filters.role !== 'all') {
      params.set('role', filters.role);
    }
    if (filters.action !== 'all') {
      params.set('action', filters.action);
    }
    if (filters.entityType !== 'all') {
      params.set('entityType', filters.entityType);
    }
    if (filters.severity !== 'all') {
      params.set('severity', filters.severity);
    }
    if (filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.tags.trim()) {
      const tags = filters.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(',');
      if (tags) {
        params.set('tags', tags);
      }
    }
    if (filters.dateRange?.from) {
      params.set('startDate', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange?.to) {
      params.set('endDate', filters.dateRange.to.toISOString());
    }

    return `/api/activity?${params.toString()}`;
  }, [organizationId, page, filters]);

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<ActivityResponse>(queryKey, fetcher, {
    keepPreviousData: true,
  });

  const logs = data?.data?.logs ?? [];
  const pagination = data?.data?.pagination;
  const errorMessage =
    error?.message || (data && !data.success ? data.error : undefined);

  const handleFilterChange = (next: Partial<ActivityFilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (!pagination) return;
    if (direction === 'prev' && pagination.hasPreviousPage) {
      setPage((prev) => Math.max(prev - 1, 1));
    } else if (direction === 'next' && pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const handleExport = async (format: 'csv') => {
    try {
      setExporting(true);
      const [, queryString = ''] = queryKey.split('?');
      const params = new URLSearchParams(queryString);
      params.set('format', format);
      params.set('page', '1');
      params.set('limit', '100');
      params.set('exportLimit', '750');

      const response = await fetch(`/api/activity?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export activity logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('Activity logs exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 space-y-8">
      <header className="space-y-2">
        <Badge variant="outline" className="rounded-full border-zinc-300 text-xs uppercase tracking-wide">
          {orgSlug}
        </Badge>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-serif font-normal tracking-tight text-zinc-900">
              Activity log
            </h1>
            <p className="text-zinc-600">
              Audit every action across your organization in real time.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <ActivityFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        onExport={handleExport}
        isExporting={exporting}
      />

      <ActivityTimeline
        logs={logs}
        isLoading={isLoading}
        error={errorMessage}
        onRetry={() => mutate()}
      />

      {pagination && (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Page {pagination.page} of {pagination.totalPages} ·{' '}
            {pagination.total.toLocaleString()} total events
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-lg"
              size="sm"
              onClick={() => handlePageChange('prev')}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              size="sm"
              onClick={() => handlePageChange('next')}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

