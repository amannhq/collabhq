'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, X, TrendingUp, FileText } from 'lucide-react';
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
        return 'bg-green-50 text-green-700 hover:bg-green-100';
      case 'invited':
        return 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100';
      case 'suspended':
        return 'bg-red-50 text-red-700 hover:bg-red-100';
      case 'inactive':
        return 'bg-gray-50 text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-gray-50 text-gray-700 hover:bg-gray-100';
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
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-1 ring-zinc-200">
              <AvatarFallback className="bg-zinc-900 text-white font-medium text-sm">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/${orgSlug}/creators/${creator._id}`}
                className="font-medium text-zinc-900 hover:text-zinc-700 transition-colors text-sm"
              >
                {creator.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <Mail className="h-3 w-3 text-zinc-400" />
                <span className="truncate">{creator.email}</span>
                {creator.twitterHandle && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <X className="h-3 w-3 text-zinc-400" />
                    <span>{creator.twitterHandle.startsWith('@') ? creator.twitterHandle : `@${creator.twitterHandle}`}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-zinc-900">{creator.postsCount}</div>
              <div className="text-xs text-zinc-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-zinc-900">{creator.totalEngagement.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">Engagement</div>
            </div>
            <Badge className={getStatusColor(creator.status)} variant="secondary">
              {creator.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLoading}>
                  <MoreVertical className="h-3.5 w-3.5" />
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
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header with Avatar and Menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-10 w-10 ring-1 ring-zinc-200">
              <AvatarFallback className="bg-zinc-900 text-white font-medium text-sm">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/${orgSlug}/creators/${creator._id}`}
                className="font-medium text-zinc-900 hover:text-zinc-700 transition-colors text-sm"
              >
                {creator.name}
              </Link>
              <p className="text-xs text-zinc-500 mt-0.5">
                Joined {formatDistanceToNow(new Date(creator.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLoading}>
                <MoreVertical className="h-3.5 w-3.5" />
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

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Mail className="h-3 w-3 text-zinc-400" />
            <span className="truncate">{creator.email}</span>
          </div>
          {creator.twitterHandle && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <X className="h-3 w-3 text-zinc-400" />
              <span>{creator.twitterHandle.startsWith('@') ? creator.twitterHandle : `@${creator.twitterHandle}`}</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          <Badge className={getStatusColor(creator.status)} variant="secondary">
            {creator.status}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <FileText className="h-3 w-3 text-zinc-400" />
            </div>
            <div className="text-lg font-semibold text-zinc-900">{creator.postsCount}</div>
            <p className="text-xs text-zinc-500 mt-0.5">Posts</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <FileText className="h-3 w-3 text-green-600" />
            </div>
            <div className="text-lg font-semibold text-green-900">{creator.approvedPosts}</div>
            <p className="text-xs text-green-600 mt-0.5">Approved</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="h-3 w-3 text-blue-600" />
            </div>
            <div className="text-lg font-semibold text-blue-900">
              {creator.totalEngagement > 999
                ? `${(creator.totalEngagement / 1000).toFixed(1)}k`
                : creator.totalEngagement}
            </div>
            <p className="text-xs text-blue-600 mt-0.5">Engagement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
