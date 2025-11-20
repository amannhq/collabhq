'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  BarChart3,
  Settings,
  PanelLeft,
} from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';


interface AdminSidebarProps {
  orgSlug: string;
  orgName: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  organizationId?: string;
  pendingPostsCount?: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
}

const navigationItems: NavItem[] = [
  {
    name: 'Overview',
    href: '',
    icon: LayoutDashboard,
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    name: 'Creators',
    href: '/creators',
    icon: Users,
  },
  {
    name: 'Posts',
    href: '/posts',
    icon: FileText,
    badge: true,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AdminSidebar({ orgSlug, orgName, userName, userEmail, pendingPostsCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();

  const isActive = (href: string) => {
    const fullPath = `/${orgSlug}${href}`;
    if (href === '') {
      return pathname === `/${orgSlug}`;
    }
    return pathname.startsWith(fullPath);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon">
      {/* Organization Header */}
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
                <Link href={`/${orgSlug}`}>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-2xl font-serif font-normal tracking-normal text-accent-foreground">{orgName}</span>
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
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const showBadge = item.badge && pendingPostsCount > 0;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={`/${orgSlug}${item.href}`}>
                        <Icon />
                        <span>{item.name}</span>
                        {showBadge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                            {pendingPostsCount > 9 ? '9+' : pendingPostsCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Section */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none">
                {userName && (
                  <span className="text-sm font-medium">{userName}</span>
                )}
                {userEmail && (
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
