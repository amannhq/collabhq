'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/config';
import { CreatorList } from '@/components/creators/CreatorList';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Creator {
  _id: string;
  name: string;
  email: string;
  twitterHandle: string;
  status: string;
  createdAt: Date;
  postsCount: number;
  approvedPosts: number;
  totalEngagement: number;
}

interface CreatorsClientProps {
  organizationId: string;
  orgSlug: string;
  initialView?: 'grid' | 'list';
  initialSearch?: string;
  initialProject?: string;
  initialStatus?: string;
}

function CreatorsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CreatorsClient({
  organizationId,
  orgSlug,
  initialView = 'grid',
  initialSearch = '',
  initialProject = 'all',
  initialStatus = 'all',
}: CreatorsClientProps) {
  // Use local state for filters to enable instant updates
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [project, setProject] = useState(initialProject);
  const [view, setView] = useState<'grid' | 'list'>(initialView);

  // Build query params for API using local state (enables instant updates)
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      orgId: organizationId,
    });
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);
    if (project !== 'all') params.set('project', project);
    return params.toString();
  }, [organizationId, search, status, project]);

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: Creator[];
    error?: string;
  }>(`/api/creators?${queryParams}`, fetcher, {
    dedupingInterval: 20000, // 20 seconds - creator list changes infrequently
    revalidateIfStale: true,
    keepPreviousData: true, // Show old data while loading new
    revalidateOnFocus: false, // Don't refetch on focus
    shouldRetryOnError: true,
    errorRetryCount: 2,
  });

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Creators</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your content creators
            </p>
          </div>
          <Link href={`/${orgSlug}/creators/invite`}>
            <Button className="bg-zinc-900 hover:bg-zinc-800">
              <UserPlus className="h-4 w-4" />
              Invite Creator
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load creators. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Creators</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your content creators
            </p>
          </div>
          <Link href={`/${orgSlug}/creators/invite`}>
            <Button className="bg-zinc-900 hover:bg-zinc-800">
              <UserPlus className="h-4 w-4" />
              Invite Creator
            </Button>
          </Link>
        </div>
        <CreatorsSkeleton />
      </div>
    );
  }

  const creators = data?.data || [];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Creators</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your content creators
          </p>
        </div>
        <Link href={`/${orgSlug}/creators/invite`}>
          <Button className="bg-zinc-900 hover:bg-zinc-800">
            <UserPlus className="h-4 w-4" />
            Invite Creator
          </Button>
        </Link>
      </div>

      {/* Creators List */}
      <CreatorList 
        creators={creators} 
        orgSlug={orgSlug} 
        view={view}
        search={search}
        status={status}
        project={project}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onProjectChange={setProject}
        onViewChange={setView}
        onRefresh={mutate}
      />
    </div>
  );
}
