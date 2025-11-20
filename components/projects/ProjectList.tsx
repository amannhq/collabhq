'use client';

import { ProjectCard } from './ProjectCard';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';

interface ProjectListProps {
  projects: Array<{
    _id: string;
    name: string;
    description?: string;
    status: string;
    creatorCount?: number;
    postCount?: number;
    settings?: {
      requirePostApproval?: boolean;
      metricUpdateFrequency?: number;
      autoReminders?: boolean;
    };
  }>;
  orgSlug: string;
}

export function ProjectList({ projects, orgSlug }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <FolderKanban className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-900 mb-1">No projects found</p>
          <p className="text-xs text-muted-foreground">
            Projects will appear here once created
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project._id} project={project} orgSlug={orgSlug} />
      ))}
    </div>
  );
}
