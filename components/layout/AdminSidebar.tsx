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
  Building2,
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
import { NotificationBell } from '@/components/notifications';

interface AdminSidebarProps {
  orgSlug: string;
  orgName: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  organizationId?: string;
}

const navigation = [
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

export function AdminSidebar({ orgSlug, orgName, userName, userEmail, userId, organizationId }: AdminSidebarProps) {
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
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">{orgName}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-1">
            {open && userId && (
              <div className="hidden lg:block">
                <NotificationBell userId={userId} />
              </div>
            )}
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
              {navigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={`/${orgSlug}${item.href}`}>
                        <Icon />
                        <span>{item.name}</span>
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
