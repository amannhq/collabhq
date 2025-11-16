'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';
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
  const [view] = useState<'grid' | 'list'>(initialView);

  // Build query params for API
  const queryParams = new URLSearchParams({
    orgId: organizationId,
    ...(initialSearch && { search: initialSearch }),
    ...(initialProject !== 'all' && { project: initialProject }),
    ...(initialStatus !== 'all' && { status: initialStatus }),
  });

  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: Creator[];
    error?: string;
  }>(`/api/creators?${queryParams.toString()}`, fetcher);

  if (error) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Creators</h2>
            <p className="text-muted-foreground">
              Manage and track your content creators
            </p>
          </div>
          <Link href={`/${orgSlug}/creators/invite`}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
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
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Creators</h2>
            <p className="text-muted-foreground">
              Manage and track your content creators
            </p>
          </div>
          <Link href={`/${orgSlug}/creators/invite`}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
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
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Creators</h2>
          <p className="text-muted-foreground">
            Manage and track your content creators
          </p>
        </div>
        <Link href={`/${orgSlug}/creators/invite`}>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Creator
          </Button>
        </Link>
      </div>

      {/* Creators List */}
      <CreatorList creators={creators} orgSlug={orgSlug} view={view} />
    </div>
  );
}
