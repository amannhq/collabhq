'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderKanban, Users, FileText, MoreVertical, Settings, BarChart } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: {
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
  };
  orgSlug: string;
}

export function ProjectCard({ project, orgSlug }: ProjectCardProps) {
  const statusConfig: Record<string, { className: string }> = {
    active: { className: 'bg-green-50 text-green-700 hover:bg-green-100' },
    paused: { className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    completed: { className: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    archived: { className: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
  };

  const config = statusConfig[project.status] || statusConfig.active;

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{project.name}</span>
            </CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2 text-sm">
                {project.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${orgSlug}/projects/${project._id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${orgSlug}/projects/${project._id}/analytics`}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge
            variant="secondary"
            className={`${config.className} border-0 capitalize`}
          >
            {project.status}
          </Badge>
          {project.settings?.requirePostApproval && (
            <Badge variant="outline" className="text-xs border-zinc-200">
              Requires Approval
            </Badge>
          )}
          {project.settings?.autoReminders && (
            <Badge variant="outline" className="text-xs border-zinc-200">
              Auto Reminders
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-zinc-900">{project.creatorCount || 0}</span>
              <span className="text-muted-foreground">Creators</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-zinc-900">{project.postCount || 0}</span>
              <span className="text-muted-foreground">Posts</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 mt-auto">
        <Link href={`/${orgSlug}/projects/${project._id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Project
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
