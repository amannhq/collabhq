'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';

interface CreatorSidebarProps {
  creator: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    creatorProfile?: {
      twitterHandle?: string;
      status?: string;
    };
  };
  stats?: {
    totalPosts: number;
    totalEngagement: number;
    pendingPosts: number;
  };
}

const navItems = [
  {
    title: 'Overview',
    href: '',
    icon: LayoutDashboard,
  },
  {
    title: 'My Posts',
    href: '/posts',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

export function CreatorSidebar({ creator, stats }: CreatorSidebarProps) {
  const pathname = usePathname();
  const baseUrl = `/creator/${creator._id}`;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'invited':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'suspended':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Creator Portal</span>
        </div>

        {/* Creator Profile */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback>{getInitials(creator.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{creator.name}</p>
              {creator.creatorProfile?.twitterHandle && (
                <p className="text-sm text-muted-foreground truncate">
                  {creator.creatorProfile.twitterHandle}
                </p>
              )}
            </div>
          </div>

          {creator.creatorProfile?.status && (
            <Badge
              variant="secondary"
              className={cn('w-fit', getStatusColor(creator.creatorProfile.status))}
            >
              {creator.creatorProfile.status}
            </Badge>
          )}
        </div>

        <Separator className="my-4" />

        {/* Quick Stats */}
        {stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Posts</span>
              <span className="font-semibold">{stats.totalPosts}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                {stats.totalEngagement.toLocaleString()}
              </span>
            </div>
            {stats.pendingPosts > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                  {stats.pendingPosts}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action */}
      <div className="px-6 pb-4">
        <Button asChild className="w-full" size="sm">
          <Link href={`${baseUrl}/posts/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit New Post
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const href = `${baseUrl}${item.href}`;
          const isActive = pathname === href || (item.href && pathname.startsWith(href));

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer Actions */}
      <div className="p-4 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          asChild
        >
          <Link href={`${baseUrl}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive"
          asChild
        >
          <Link href="/api/auth/signout">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Link>
        </Button>
      </div>
    </div>
  );
}
