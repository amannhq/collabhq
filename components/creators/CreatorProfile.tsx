'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Twitter, Calendar, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface CreatorProfileProps {
  creator: {
    _id: string;
    name: string;
    email: string;
    twitterHandle?: string;
    status: string;
    createdAt: Date;
  };
  stats: {
    totalPosts: number;
    approvedPosts: number;
    totalEngagement: number;
    avgEngagement: number;
  };
  orgSlug: string;
}

export function CreatorProfile({ creator }: CreatorProfileProps) {
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{creator.name}</h1>
                <Badge className={getStatusColor(creator.status)} variant="secondary">
                  {creator.status}
                </Badge>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {creator.email}
                </div>
                {creator.twitterHandle && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Twitter className="h-4 w-4" />
                    {creator.twitterHandle.startsWith('@') ? creator.twitterHandle : `@${creator.twitterHandle}`}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDistanceToNow(new Date(creator.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isLoading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Send Notification</DropdownMenuItem>
              <DropdownMenuItem>Edit Profile</DropdownMenuItem>
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
