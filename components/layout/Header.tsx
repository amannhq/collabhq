'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { NotificationBell } from '@/components/notifications';

interface HeaderProps {
  orgSlug: string;
  orgName: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  organizationId?: string;
}

export function Header({ orgSlug, orgName, userName, userEmail, userId, organizationId }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 bg-background px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar
            orgSlug={orgSlug}
            orgName={orgName}
            userName={userName}
            userEmail={userEmail}
          />
        </SheetContent>
      </Sheet>

      {/* Organization Name - Mobile Only */}
      <div className="flex-1 lg:hidden">
        <h2 className="text-lg font-semibold">{orgName}</h2>
      </div>

      {/* Spacer for Desktop to push content to right */}
      <div className="hidden lg:flex lg:flex-1"></div>

      {/* Notifications */}
      {userId && (
        <NotificationBell userId={userId} organizationId={organizationId} />
      )}
    </header>
  );
}
