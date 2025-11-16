'use client';

import { ProjectCard } from './ProjectCard';

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
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects found</p>
      </div>
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
