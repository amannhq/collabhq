'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreatorCard } from './CreatorCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Grid3x3, List, SlidersHorizontal } from 'lucide-react';

interface Creator {
  _id: string;
  name: string;
  email: string;
  twitterHandle?: string;
  status: string;
  createdAt: Date;
  postsCount: number;
  approvedPosts: number;
  totalEngagement: number;
}

interface CreatorListProps {
  creators: Creator[];
  orgSlug: string;
  view: 'grid' | 'list';
  search: string;
  status: string;
  project: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onViewChange: (value: 'grid' | 'list') => void;
  onRefresh?: () => void;
}

export function CreatorList({ 
  creators, 
  orgSlug, 
  view,
  search,
  status,
  project,
  onSearchChange,
  onStatusChange,
  onProjectChange,
  onViewChange,
  onRefresh,
}: CreatorListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  
  // Sync local state with URL params on mount and when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlStatus = searchParams.get('status') || 'all';
    const urlProject = searchParams.get('project') || 'all';
    const urlView = (searchParams.get('view') || 'grid') as 'grid' | 'list';
    
    if (urlSearch !== search) onSearchChange(urlSearch);
    if (urlStatus !== status) onStatusChange(urlStatus);
    if (urlProject !== project) onProjectChange(urlProject);
    if (urlView !== view) onViewChange(urlView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only sync when URL params change (intentionally not including all deps to avoid loops)

  const buildHref = useCallback(
    (paramsString: string) =>
      paramsString ? `/${orgSlug}/creators?${paramsString}` : `/${orgSlug}/creators`,
    [orgSlug]
  );

  // Debounced search with URL sync
  useEffect(() => {
    const handler = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      if (status !== 'all') {
        params.set('status', status);
      } else {
        params.delete('status');
      }
      if (project !== 'all') {
        params.set('project', project);
      } else {
        params.delete('project');
      }
      params.set('view', view);

      const nextParamsString = params.toString();
      const currentParamsString = searchParams.toString();
      
      if (nextParamsString !== currentParamsString) {
        const href = buildHref(nextParamsString);
        startTransition(() => {
          router.push(href, { scroll: false }); // Don't scroll on filter changes
        });
      }
    }, 300);

    return () => {
      window.clearTimeout(handler);
    };
  }, [search, status, project, view, searchParams, router, buildHref]);

  const handleSearch = (value: string) => {
    onSearchChange(value);
  };

  const handleStatusFilter = (value: string) => {
    onStatusChange(value);
  };

  const handleViewChange = (newView: 'grid' | 'list') => {
    onViewChange(newView);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={status} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => handleViewChange(v as 'grid' | 'list')}>
            <TabsList>
              <TabsTrigger value="grid">
                <Grid3x3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Creators Grid/List */}
      {creators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No creators found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search
              ? 'Try adjusting your search or filters'
              : 'Get started by inviting your first creator'}
          </p>
        </div>
      ) : (
        <div
          className={
            view === 'grid'
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-4'
          }
        >
          {creators.map((creator) => (
            <CreatorCard
              key={creator._id}
              creator={creator}
              orgSlug={orgSlug}
              view={view}
            />
          ))}
        </div>
      )}
    </div>
  );
}
