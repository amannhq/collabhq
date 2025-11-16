'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Settings, 
  BarChart3, 
  Users, 
  FileText,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectDetailProps {
  project: {
    _id: string;
    name: string;
    description?: string;
    status: string;
    settings: {
      requirePostApproval: boolean;
      metricUpdateFrequency: number;
      autoReminders: boolean;
    };
    organizationId: string;
  };
  organizationSlug: string;
}

interface Post {
  _id: string;
  postUrl: string;
  status: string;
  createdAt: string;
  creator: {
    name: string;
    twitterHandle: string;
  };
  latestMetrics?: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
}

export function ProjectDetail({ project, organizationSlug }: ProjectDetailProps) {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  async function fetchRecentPosts() {
    try {
      const response = await fetch(`/api/posts?projectId=${project._id}&limit=10`);
      const result = await response.json();

      if (result.success) {
        setRecentPosts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent posts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/${organizationSlug}/projects/${project._id}/creators`}>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Creators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Add or remove creators from this project
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${organizationSlug}/projects/${project._id}/analytics`}>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Detailed performance metrics and insights
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configure project preferences
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts">
            <FileText className="h-4 w-4 mr-2" />
            Recent Posts
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>
                Latest posts submitted to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading posts...
                </div>
              ) : recentPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No posts yet</p>
                  <p className="text-sm">Posts will appear here once creators submit them</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPosts.map((post) => {
                      const engagement =
                        (post.latestMetrics?.likes || 0) +
                        (post.latestMetrics?.retweets || 0) +
                        (post.latestMetrics?.replies || 0);

                      return (
                        <TableRow key={post._id}>
                          <TableCell>
                            <a
                              href={post.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              View Post
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{post.creator.name}</p>
                              <p className="text-xs text-muted-foreground">
                                @{post.creator.twitterHandle}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell>
                            {engagement > 0 ? engagement.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell>
                            <Link href={`/${organizationSlug}/posts/${post._id}`}>
                              <Button variant="ghost" size="sm">
                                Details
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>
                Current configuration for this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Post Approval</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.settings.requirePostApproval
                      ? 'Required - All posts must be approved before tracking'
                      : 'Not required - Posts are automatically approved'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Metric Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Every {project.settings.metricUpdateFrequency} hours
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Auto Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.settings.autoReminders
                      ? 'Enabled - Creators receive automatic reminders'
                      : 'Disabled - No automatic reminders'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Project Status</h4>
                  <Badge
                    variant={project.status === 'active' ? 'default' : 'secondary'}
                  >
                    {project.status}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
