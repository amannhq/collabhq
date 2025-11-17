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
}

export function CreatorList({ creators, orgSlug, view: initialView }: CreatorListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSearch = searchParams.get('search') || '';
  const searchParamsString = searchParams.toString();
  const [searchTerm, setSearchTerm] = useState(activeSearch);
  const [view, setView] = useState<'grid' | 'list'>(initialView);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [, startTransition] = useTransition();
  const buildHref = useCallback(
    (paramsString: string) =>
      paramsString ? `/${orgSlug}/creators?${paramsString}` : `/${orgSlug}/creators`,
    [orgSlug]
  );

  useEffect(() => {
    setSearchTerm(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    if (searchTerm === activeSearch) {
      return;
    }

    const handler = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }

      const nextParamsString = params.toString();
      if (nextParamsString === searchParamsString) {
        return;
      }
      const href = buildHref(nextParamsString);
      startTransition(() => {
        router.push(href);
      });
    }, 300);

    return () => {
      window.clearTimeout(handler);
    };
  }, [searchTerm, activeSearch, searchParamsString, router, buildHref]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParamsString);
    if (value && value !== 'all') {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    const nextParamsString = params.toString();
    if (nextParamsString === searchParamsString) {
      return;
    }
    const href = buildHref(nextParamsString);
    startTransition(() => {
      router.push(href);
    });
  };

  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView);
    const params = new URLSearchParams(searchParamsString);
    params.set('view', newView);
    const nextParamsString = params.toString();
    if (nextParamsString === searchParamsString) {
      return;
    }
    const href = buildHref(nextParamsString);
    startTransition(() => {
      router.push(href);
    });
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
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
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
            {searchTerm
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
