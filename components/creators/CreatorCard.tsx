'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, Twitter, TrendingUp, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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

interface CreatorCardProps {
  creator: Creator;
  orgSlug: string;
  view: 'grid' | 'list';
}

export function CreatorCard({ creator, orgSlug, view }: CreatorCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'invited':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'suspended':
        return 'bg-red-500/10 text-red-500';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  async function handleSuspend() {
    if (!confirm('Are you sure you want to suspend this creator?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/creators/${creator._id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Suspended by admin' }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to suspend creator');
      }

      toast.success('Creator suspended successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to suspend creator');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleActivate() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/creators/${creator._id}/activate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to activate creator');
      }

      toast.success('Creator activated successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate creator');
    } finally {
      setIsLoading(false);
    }
  }

  if (view === 'list') {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/${orgSlug}/creators/${creator._id}`}
                className="font-semibold hover:underline"
              >
                {creator.name}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {creator.email}
                {creator.twitterHandle && (
                  <>
                    <span>•</span>
                    <Twitter className="h-3 w-3" />
                    {creator.twitterHandle.startsWith('@') ? creator.twitterHandle : `@${creator.twitterHandle}`}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{creator.postsCount}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{creator.totalEngagement.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
            <Badge className={getStatusColor(creator.status)} variant="secondary">
              {creator.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${orgSlug}/creators/${creator._id}`}>View Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Send Notification</DropdownMenuItem>
                {creator.status === 'suspended' ? (
                  <DropdownMenuItem onClick={handleActivate}>
                    Activate Creator
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleSuspend} className="text-destructive">
                    Suspend Creator
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/${orgSlug}/creators/${creator._id}`}
                className="font-semibold hover:underline"
              >
                {creator.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                Joined {formatDistanceToNow(new Date(creator.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isLoading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${orgSlug}/creators/${creator._id}`}>View Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Send Notification</DropdownMenuItem>
              {creator.status === 'suspended' ? (
                <DropdownMenuItem onClick={handleActivate}>
                  Activate Creator
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleSuspend} className="text-destructive">
                  Suspend Creator
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {creator.email}
          </div>
          <Badge className={getStatusColor(creator.status)} variant="secondary">
            {creator.status}
          </Badge>
        </div>

        {creator.twitterHandle && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Twitter className="h-4 w-4" />
            {creator.twitterHandle.startsWith('@') ? creator.twitterHandle : `@${creator.twitterHandle}`}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{creator.postsCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Posts</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <FileText className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{creator.approvedPosts}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Approved</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {creator.totalEngagement > 999
                  ? `${(creator.totalEngagement / 1000).toFixed(1)}k`
                  : creator.totalEngagement}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Engagement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
