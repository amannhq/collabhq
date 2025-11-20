'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';
import { ProjectList } from '@/components/projects/ProjectList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Project {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  status: string;
  settings: Record<string, unknown>;
  stats: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creatorCount: number;
  postCount: number;
}

interface ProjectsClientProps {
  organizationId: string;
  orgSlug: string;
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProjectsClient({ organizationId, orgSlug }: ProjectsClientProps) {
  const [activeTab, setActiveTab] = useState('all');

  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: Project[];
    error?: string;
  }>(`/api/projects?orgId=${organizationId}`, fetcher, {
    dedupingInterval: 20000, // 20 seconds - project list changes infrequently
    revalidateIfStale: true,
    keepPreviousData: true,
  });

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your content projects
            </p>
          </div>
          <Link href={`/${orgSlug}/projects/new`}>
            <Button className="bg-zinc-900 hover:bg-zinc-800">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load projects. Please try again.
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
            <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your content projects
            </p>
          </div>
          <Link href={`/${orgSlug}/projects/new`}>
            <Button className="bg-zinc-900 hover:bg-zinc-800">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
        <ProjectsSkeleton />
      </div>
    );
  }

  const projects = data?.data || [];

  // Group projects by status
  const activeProjects = projects.filter((p) => p.status === 'active');
  const pausedProjects = projects.filter((p) => p.status === 'paused');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-normal tracking-tight text-zinc-900">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your content projects
          </p>
        </div>
        <Link href={`/${orgSlug}/projects/new`}>
          <Button className="bg-zinc-900 hover:bg-zinc-800">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeProjects.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({pausedProjects.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedProjects.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ProjectList projects={projects} orgSlug={orgSlug} />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <ProjectList projects={activeProjects} orgSlug={orgSlug} />
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          <ProjectList projects={pausedProjects} orgSlug={orgSlug} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <ProjectList projects={completedProjects} orgSlug={orgSlug} />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <ProjectList projects={archivedProjects} orgSlug={orgSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
