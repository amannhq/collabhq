'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubmitPost } from '@/contexts/SubmitPostContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  LogOut,
  TrendingUp,
  PlusCircle,
  PanelLeft,
  User,
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
  const { open, toggleSidebar } = useSidebar();
  const { openModal } = useSubmitPost();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700';
      case 'invited':
        return 'bg-yellow-50 text-yellow-700';
      case 'suspended':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-zinc-50 text-zinc-700';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <Sidebar collapsible="icon">
      {/* Creator Header */}
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                onClick={(e) => {
                  if (!open) {
                    e.preventDefault();
                    toggleSidebar();
                  }
                }}
              >
                <Link href={baseUrl}>
                  <User className="h-5 w-5" />
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-sm font-medium">{creator.name}</span>
                    {open && creator.creatorProfile?.twitterHandle && (
                      <span className="text-xs text-muted-foreground">
                        {creator.creatorProfile.twitterHandle}
                      </span>
                    )}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-1">
            {open && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleSidebar}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge & Quick Stats */}
        {open && (
          <div className="px-3 space-y-4 mt-3">
            {creator.creatorProfile?.status && (
              <Badge
                variant="secondary"
                className={getStatusColor(creator.creatorProfile.status)}
              >
                {creator.creatorProfile.status}
              </Badge>
            )}

            {/* Quick Stats */}
            {stats && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Posts</span>
                  <span className="font-semibold text-zinc-900">{stats.totalPosts}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="font-semibold text-zinc-900 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    {formatNumber(stats.totalEngagement)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </SidebarHeader>

      {/* Quick Action Button */}
      {open && (
        <div className="px-3 py-3">
          <Button
            onClick={openModal}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
            size="default"
          >
            <PlusCircle className="h-4 w-4" />
            Submit New Post
          </Button>
        </div>
      )}

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const href = `${baseUrl}${item.href}`;
                const isActive = pathname === href || (!!item.href && pathname.startsWith(href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link href={href}>
                      <SidebarMenuButton isActive={isActive}>
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Actions */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Link href="/api/auth/signout">
                <LogOut />
                <span>Sign Out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
