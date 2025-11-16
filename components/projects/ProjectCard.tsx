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
  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    archived: 'bg-gray-500',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              {project.name}
            </CardTitle>
            {project.description && (
              <CardDescription>{project.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
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
        <div className="flex items-center gap-2 mt-2">
          <Badge className={statusColors[project.status] || 'bg-gray-500'}>
            {project.status}
          </Badge>
          {project.settings?.requirePostApproval && (
            <Badge variant="outline">Requires Approval</Badge>
          )}
          {project.settings?.autoReminders && (
            <Badge variant="outline">Auto Reminders</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{project.creatorCount || 0}</span>
            <span className="text-muted-foreground">Creators</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{project.postCount || 0}</span>
            <span className="text-muted-foreground">Posts</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/${orgSlug}/projects/${project._id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Project
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
